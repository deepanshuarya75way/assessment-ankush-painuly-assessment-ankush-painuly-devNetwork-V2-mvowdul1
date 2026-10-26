import Post from "../models/post.js";
import Connection from "../models/connection.js";
// @POST 
export const createPost = async (req, res) => {
    try {
      const { content, tags, codeSnippet, visibility } = req.body;
  
      // ─── VALIDATE ─────────────────────────────────────────
      if (!content && !req.file) {
        return res.status(400).json({
          success: false,
          message: "Post content is required",
        });
      }
  
      // ─── BUILD POST OBJECT ────────────────────────────────
      const postData = {
        author:     req.user._id,
        content,
        visibility: visibility || "public",
      };
  
      // ─── OPTIONAL FIELDS ──────────────────────────────────
      if (tags)        postData.tags        = JSON.parse(tags);
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
      const { page = 1, limit = 10 } = req.query;
  
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
  
      // ─── INCLUDE MYSELF IN FEED ───────────────────────────
      const feedUserIds = [...connectedUserIds, req.user._id];
  
      // ─── FETCH POSTS ──────────────────────────────────────
      const posts = await Post.find({
        author:     { $in: feedUserIds },
      })
        .populate("author",   "name avatar headline subscription")
        .populate("comments.user", "name avatar headline subscription")
        .populate({
          path: "repostOf",
          populate: {
            path: "author",
            select: "name avatar headline subscription",
          },
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
  
      // ─── TOTAL COUNT FOR PAGINATION ───────────────────────
      const total = await Post.countDocuments({
        author:     { $in: feedUserIds },
      });
  
      res.status(200).json({
        success: true,
        posts,
        total,
        page:    parseInt(page),
        pages:   Math.ceil(total / limit),
        hasMore: page * limit < total, // frontend uses this to load more
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

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
