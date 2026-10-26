import Post from "../models/post.js";
import Connection from "../models/connection.js";
// @POST 
export const createPost = async (req, res) => {
    try {
      const { content, tags, codeSnippet, visibility,postType } = req.body;
      // ─── VALIDATE ─────────────────────────────────────────
      if (!content && !req.file) {
        return res.status(400).json({
          success: false,
          message: "Post content is required",
        });
      }

      const allowedTypes = ["discussion","code","carrer","showcase"];
      if(postType && !allowedTypes.include(postType)){
        return res.status(400).json({success: false, message: "Invalid post type"});
      }
  
      // ─── BUILD POST OBJECT ────────────────────────────────
      const postData = {
        author:     req.user._id,
        content,
        visibility: visibility || "public",
        postType: postType || (codeSnippet ? "code": "discussion"),
      };
  
      // ─── OPTIONAL FIELDS ──────────────────────────────────
      if (tags)        postData.tags        = [...new Set(JSON.parse(tags).map((tag)=>
         tag.trim().replece(/^#/,"").toLowerCase()).filter(Boolean))];

      if (codeSnippet) postData.codeSnippet = JSON.parse(codeSnippet);
      if (req.file)    postData.image       = req.file.path; // cloudinary url
  
      // ─── CREATE POST ──────────────────────────────────────
      const post = await Post.create(postData);
  
      // ─── POPULATE AUTHOR ──────────────────────────────────
      await post.populate("author", "name avatar headline subscription");
  
      res.status(201).json({
        success: true,
        message: "Post created successfully",
        post,
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };


  // @GET 
export const getFeed = async (req, res) => {
    try {
      const page = Math.max(1,parseInt(req.query.page,10) || 1);
      const limit = Math.min(2, Math.max(2,parseInt(req.query.limit, 2) || 2));
      const sort = req.query.sort === "trending" ? "trending" : "recent";
      const allowedTypes = ["discussion","code","career","showcase"];
      const postType = allowedTypes.includes(req.query.postType) ? req.query.postType : null;

      const tags = (Array.isArray(req.query.tags) ? req.query.tags.join(",") :
       req.query.tags || "")
       .split(",")
       .map((tag)=> tag.trim().replace(/^#/, "").toLowerCase())
       .filter(Boolean);
  
      // ─── GET MY CONNECTIONS ───────────────────────────────
      const connections = await Connection.find({
        $or: [
          { sender:   req.user._id },
          { receiver: req.user._id },
        ],
        status: "accepted",
      });
  
      // ─── GET CONNECTION IDs ───────────────────────────────
      const connectedUserIds = connections.map((c) =>
        c.sender.toString() === req.user._id.toString()
          ? c.receiver
          : c.sender
      );

      //include post from curr user and accepted
      const query = {author: {$in: [...connectedUserIds,req.user._id]}};
      if(tags.length) query.tags = {$all: tags};// req post to have every selected tag

      if(postType === "discussion"){ // it will also include older post which dont have postType field
        query.$and = [{$or: [{postType: "discussion"}, { postType: {$exists: false}
        }]}];
      }
      else if(postType){
        query.postType = postType;
      }

      //chose the server side sort order
      const sortStage = sort === "trending"
      ? {engagementScore: -1, createdAt: -1}
      : {createdAt: -1};

      // run 2 db query parallet Post.agg, and post.countdoc
      const [posts,total] = await Promise.all([
        Post.aggregate([
          {$match : query},
          {
            $addFields : {
              //this computes the engagement score for each post , each react type contributes its no. of reaction
              //  , ifNuLL substitute an empty array when a field is missing
              engagementScore: {
                $add: [
                  {$size: {$ifNull: ["$reaction.fire",[]]}},
                  {$size: {$ifNull: ["$reaction.insightful",[]]}},
                  {$size: {$ifNull: ["$reaction.nicework",[]]}},
                  {$size: {$ifNull: ["$reaction.interesting",[]]}},
                  {$multiply: [{$size: {$ifNull: ["$comments", []] }}, 2]},
                  {$multiply: [{$size: {$ifNull: ["$reposts", []] }}, 3]}
                ],
              },
            },
          },
          {$sort: sortStage},
          {$skip: (page-1)*limit},
          {$limit: limit},
          {$project: {engagementScore: 0}},//remove engagement score from api response //it ned temp
        ]),
        Post.countDocuments(query),
      ])


      await Post.populate(posts,[
        {path: "author", select: "name avatar headline subscription"},
        {path: "comments.user", select: "name avatar headline subscription"},
        {
          path:"repostOf",
          populate:{path: "author", select: "name avatar headline subscription"},
        },
      ]);
  
     
  
      res.status(200).json({
        success: true,
        posts,
        total,
        page,
        pages:   Math.ceil(total / limit),
        hasMore: page * limit < total, // frontend uses this to load more
        filters: {tags, postType,sort},
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };


export const getTrendingTags = async (req,res)=> {
  try{
    const days = Math.min(90, Math.max(1, parseInt(req.query.days,10) || 30)); // range last 1 - 90 , deafult 30
    const limit = Math.min(30,Math.max(1,parseInt(req.query.limit,10) || 12)); // controls how many tags the endpoint returns, default 12
    const since = new Date(Date.now() - days*24*60*60*1000);
    
    const tags = await Post.aggregate([
      {$match: {createdAt: {$gte: since}, tags: {$exists: true, $ne:[] }}}, //keeps only recent posts that have a non-empty tags
      {$unwind: "$tags"}, // turns each post tag array into separate entries,
      {$group: {_id: {$toLower: "$tags"},count: {$sum:1 }}},// combines entris with the same lowercase tag
      {$sort: {count: -1,_id: 1}},// ranks by freq , highest first
      {$limit: limit},
      {$project: {_id: 0,tags:"$_id",count:1}},
    ]);
    res.status(200).json({success: true, tags,days});
  }
  catch(err){
   
    res.status(500).json({success:false, message: err.message});
  }
}

  // @PATCH 
export const reactToPost = async (req, res) => {
    try {
      const { reaction } = req.body;
      const userId = req.user._id;
  
      // ─── VALIDATE REACTION ────────────────────────────────
      const allowedReactions = ["fire", "insightful", "nicework", "interesting"];
      if (!allowedReactions.includes(reaction)) {
        return res.status(400).json({
          success: false,
          message: "Invalid reaction type",
        });
      }
  
      // ─── FIND POST ────────────────────────────────────────
      const post = await Post.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }
  
      // ─── CHECK IF ALREADY REACTED WITH SAME REACTION ──────
      const alreadyReacted = post.reactions[reaction].includes(userId);
  
      if (alreadyReacted) {
        // ─── UNREACT — remove from that reaction ────────────
        post.reactions[reaction] = post.reactions[reaction].filter(
          (id) => id.toString() !== userId.toString()
        );
      } else {
        // ─── REMOVE FROM ALL OTHER REACTIONS FIRST ───────────
        // user can only have one reaction at a time
        allowedReactions.forEach((r) => {
          post.reactions[r] = post.reactions[r].filter(
            (id) => id.toString() !== userId.toString()
          );
        });
  
        // ─── ADD NEW REACTION ─────────────────────────────
        post.reactions[reaction].push(userId);
      }
  
      await post.save();
  
      res.status(200).json({
        success:      true,
        reactions:    post.reactions,
        userReaction: alreadyReacted ? null : reaction,
        // null means unreacted
        // reaction name means currently reacted with this
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  // @POST 
export const addComment = async (req, res) => {
    try {
      const { text } = req.body;
  
      // ─── VALIDATE ─────────────────────────────────────────
      if (!text) {
        return res.status(400).json({
          success: false,
          message: "Comment text is required",
        });
      }
  
      // ─── FIND POST ────────────────────────────────────────
      const post = await Post.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }
  
      // ─── ADD COMMENT ──────────────────────────────────────
      post.comments.unshift({
        user: req.user._id,
        text,
      });
  
      await post.save();
  
      // ─── POPULATE COMMENT USER ────────────────────────────
      await post.populate("comments.user", "name avatar headline subscription");
  
      res.status(201).json({
        success:  true,
        message:  "Comment added",
        comments: post.comments,
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };


// @DELETE 
export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // ─── FIND COMMENT ─────────────────────────────────────
    // comments is an embedded array of subdocuments
    // Mongoose gives you .id() method to find subdocument by _id
    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // ─── ONLY COMMENT OWNER OR POST AUTHOR CAN DELETE ─────
    const isCommentOwner = comment.user.toString() === req.user._id.toString();
    const isPostAuthor   = post.author.toString()   === req.user._id.toString();

    if (!isCommentOwner && !isPostAuthor) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    // ─── DELETE COMMENT ───────────────────────────────────
    comment.deleteOne();
    await post.save();

    res.status(200).json({
      success:  true,
      message:  "Comment deleted",
      comments: post.comments,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE 
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    // ─── CHECK EXISTS ─────────────────────────────────────
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // ─── ONLY POST AUTHOR CAN DELETE ──────────────────────
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted",
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH 
export const savePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isSaved = post.savedBy.includes(req.user._id);

    if (isSaved) {
      // ─── UNSAVE ───────────────────────────────────────
      post.savedBy = post.savedBy.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      // ─── SAVE ─────────────────────────────────────────
      post.savedBy.push(req.user._id);
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: isSaved ? "Post unsaved" : "Post saved",
      isSaved: !isSaved,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET 
export const getSavedPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      savedBy: req.user._id, // ← find posts where my id is in savedBy
    })
      .populate("author", "name avatar headline subscription")
      .populate("comments.user", "name avatar headline subscription")
      .populate({
        path: "repostOf",
        populate: {
          path: "author",
          select: "name avatar headline subscription",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      posts,
      total: posts.length,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// @GET 
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("author",        "name avatar headline subscription")
      .populate("comments.user", "name avatar headline subscription")
      .populate({
        path: "repostOf",
        populate: {
          path: "author",
          select: "name avatar headline subscription",
        },
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      post,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET 
export const getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({
      author:   req.params.userId,
      repostOf: null, // ← only original posts, not reposts
    })
      .populate("author", "name avatar headline subscription")
      .populate("comments.user", "name avatar headline subscription")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({
      author:   req.params.userId,
      repostOf: null,
    });

    res.status(200).json({
      success: true,
      posts,
      total,
      page:    parseInt(page),
      pages:   Math.ceil(total / limit),
      hasMore: page * limit < total,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// @POST 
export const repost = async (req, res) => {
  try {
    const { note } = req.body; // optional message with repost

    // ─── FIND ORIGINAL POST ───────────────────────────────
    const originalPost = await Post.findById(req.params.postId);
    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // ─── CANT REPOST YOUR OWN POST ────────────────────────
    if (originalPost.author.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You can't repost your own post",
      });
    }

    if(originalPost.repostOf) {
      return res.status(400).json({
        success: false,
        message: "You can't repost a repost",
      });
    }

    // ─── CANT REPOST TWICE ────────────────────────────────
    const alreadyReposted = originalPost.reposts.includes(req.user._id);
    if (alreadyReposted) {
      return res.status(400).json({
        success: false,
        message: "You have already reposted this post",
      });
    }

    // ─── CREATE REPOST ────────────────────────────────────
    const repostedPost = await Post.create({
      author:   req.user._id,
      content:  note || "",        // optional note
      repostOf: originalPost._id,  // reference to original
    });

    // ─── ADD USER TO ORIGINAL POST REPOSTS ARRAY ──────────
    originalPost.reposts.push(req.user._id);
    await originalPost.save();

    await repostedPost.populate("author",   "name avatar headline subscription");
    await repostedPost.populate({
      path: "repostOf",
      populate: {
        path: "author",
        select: "name avatar headline subscription",
      },
    });

    res.status(201).json({
      success: true,
      message: "Post reposted",
      post:    repostedPost,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
