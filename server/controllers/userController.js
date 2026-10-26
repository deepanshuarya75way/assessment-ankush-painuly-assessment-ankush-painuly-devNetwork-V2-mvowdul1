import User from "../models/user.js";
import Connection from "../models/connection.js";

// @GET /api/users/:userId
export const getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.params.userId)
        .select("-password -otp -otpExpiry -lastOtpSentAt");
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      //check isfollowing
      const isFollowing = user.followers.some(
        (followerId) => followerId.toString() === req.user._id.toString()
      );
      const isBlocked = req.user.blockedUsers.some(
        (blockedUserId) => blockedUserId.toString() === req.params.userId.toString()
      );
  
      // ─── CONNECTION STATUS WITH THIS USER ─────────────────
      const connection = await Connection.findOne({
        $or: [
          { sender: req.user._id,    receiver: req.params.userId },
          { sender: req.params.userId, receiver: req.user._id   },
        ],
      });
  
      const connectionStatus = connection
        ? {
            status:       connection.status,
            connectionId: connection._id,
            isSender:     connection.sender.toString() === req.user._id.toString(),
          }
        : null;
  
      res.status(200).json({
        success: true,
        user,
        connectionStatus,
        isFollowing,
        isBlocked,
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  // @PATCH /api/users/update
export const updateProfile = async (req, res) => {
    try {
      const allowedFields = [
        "name",
        "bio",
        "headline",
        "location",
        "github",
        "linkedin",
        "website",
        "skills",
        "techStack",
        "availability",
        "experience",
        "projects",
      ];
  
      // ─── ONLY ALLOW SPECIFIC FIELDS ───────────────────────
      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (req.body.tachstack !== undefined && updates.techStack === undefined) {
        updates.techStack = req.body.tachstack;
      }
  
      const user = await User.findById(req.user._id);
      Object.assign(user, updates);
      user.calcProfileCompletion();
      await user.save();
  
      res.status(200).json({
        success: true,
        message: "Profile updated",
        user,
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  // @PATCH /api/users/avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const user = await User.findById(req.user._id);
    user.avatar = req.file.path; // cloudinary url
    user.calcProfileCompletion();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar updated",
      avatar:  user.avatar,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/users/discover
export const discoverUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const connections = await Connection.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id },
      ],
      status: { $in: ["accepted", "pending"] },
    }).select("sender receiver");

    const connectedOrRelatedUserIds = connections.map((connection) =>
      connection.sender.toString() === req.user._id.toString()
        ? connection.receiver
        : connection.sender
    );

    const usersWhoBlockedMe = await User.find({
      blockedUsers: req.user._id,
    }).select("_id");

    const excludedUserIds = [
      req.user._id,
      ...req.user.blockedUsers,//user who i blocked
      ...connectedOrRelatedUserIds,
      ...usersWhoBlockedMe.map((user) => user._id),
    ];

    const query = {
      _id: { $nin: excludedUserIds },
      isVerified: true,
    };

    const users = await User.find(query)
      .select("name avatar headline skills availability location isOnline subscription")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ profileCompletion: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/users/search?q=john&skills=react&availability=open_to_work
export const searchUsers = async (req, res) => {
  try {
    const { q, skills, availability, page = 1, limit = 10 } = req.query;

    // ─── BUILD QUERY ──────────────────────────────────────
    const query = {
      isVerified: true,
      blockedUsers: { $ne: req.user._id },
      _id: { $nin: req.user.blockedUsers },
    };

    // search by name or headline
    if (q) {
      query.$or = [
        { name:     { $regex: q, $options: "i" } },
        { headline: { $regex: q, $options: "i" } },
      ];
    }

    if (skills)       query.skills       = { $in: skills.split(",") };
    if (availability) query.availability = availability;

    const users = await User.find(query)
      .select("name avatar headline skills availability location isOnline subscription")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ profileCompletion: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      total,
      page:    parseInt(page),
      pages:   Math.ceil(total / limit),
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/users/:userId/followers
export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "followers",
      "name avatar headline location skills availability subscription"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      users: user.followers,
      total: user.followers.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/users/:userId/following
export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "following",
      "name avatar headline location skills availability subscription"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      users: user.following,
      total: user.following.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/users/blocked/list
export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "blockedUsers",
      "name avatar headline location skills availability subscription"
    );

    res.status(200).json({
      success: true,
      users: user.blockedUsers,
      total: user.blockedUsers.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// @POST /api/users/:userId/follow
export const followUser = async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You can't follow yourself",
      });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const iBlockedTarget = req.user.blockedUsers.some(
      (blockedUserId) => blockedUserId.toString() === req.params.userId
    );
    const targetBlockedMe = targetUser.blockedUsers.some(
      (blockedUserId) => blockedUserId.toString() === req.user._id.toString()
    );

    if (iBlockedTarget || targetBlockedMe) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow this user",
      });
    }

    const isFollowing = req.user.following.includes(req.params.userId);

    if (isFollowing) {
      // ─── UNFOLLOW ──────────────────────────────────────
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: req.params.userId },
      });
      await User.findByIdAndUpdate(req.params.userId, {
        $pull: { followers: req.user._id },
      });
    } else {
      // ─── FOLLOW ────────────────────────────────────────
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { following: req.params.userId },
      });
      await User.findByIdAndUpdate(req.params.userId, {
        $addToSet: { followers: req.user._id },
      });
    }

    res.status(200).json({
      success:     true,
      message:     isFollowing ? "Unfollowed" : "Following",
      isFollowing: !isFollowing,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/users/:userId/block
export const blockUser = async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You can't block yourself",
      });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ─── ADD TO BLOCKED LIST ──────────────────────────────
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: req.params.userId },
    });

    // ─── REMOVE FROM FOLLOWERS/FOLLOWING ─────────────────
    await User.findByIdAndUpdate(req.user._id, {
      $pull: {
        following: req.params.userId,
        followers: req.params.userId,
      },
    });

    await User.findByIdAndUpdate(req.params.userId, {
      $pull: {
        following: req.user._id,
        followers: req.user._id,
      },
    });

    // ─── REMOVE CONNECTION IF EXISTS ──────────────────────
    await Connection.findOneAndDelete({
      $or: [
        { sender: req.user._id,      receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id      },
      ],
    });

    res.status(200).json({
      success: true,
      message: "User blocked",
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/users/:userId/unblock
export const unblockUser = async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You can't unblock yourself",
      });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: req.params.userId },
    });

    res.status(200).json({
      success: true,
      message: "User unblocked",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
