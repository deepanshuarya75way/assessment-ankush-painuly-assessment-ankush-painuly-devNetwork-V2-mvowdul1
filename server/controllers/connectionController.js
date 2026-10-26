import Connection from "../models/connection.js";
import User from "../models/user.js";

// @POST /api/connections/send/:userId
export const sendRequest = async (req, res) => {
  try {
    const senderId   = req.user._id;//curr user
    const receiverId = req.params.userId;

    // ─── CANT SEND TO YOURSELF ────────────────────────────
    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        success: false,
        message: "You can't send a request to yourself",
      });
    }

    // ─── CHECK RECEIVER EXISTS ────────────────────────────
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ─── CHECK IF BLOCKED ─────────────────────────────────
    const iBlockedReceiver = req.user.blockedUsers.some(
      (blockedUserId) => blockedUserId.toString() === receiverId
    );
    if (iBlockedReceiver ) {
      return res.status(400).json({
        success: false,
        message: "You have blocked this user",
      });
    }

    const receiverBlockedMe = receiver.blockedUsers.some(
      (blockedUserId) => blockedUserId.toString() === req.user._id.toString()
    );

    if ( receiverBlockedMe) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a request to this user",
      });
    }


    // ─── CHECK ALREADY EXISTS ─────────────────────────────
    const existing = await Connection.findOne({
      $or: [
        { sender: senderId,   receiver: receiverId },
        { sender: receiverId, receiver: senderId   },
      ],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Connection request already exists",
        status: existing.status,
      });
    }

    // ─── CREATE REQUEST ───────────────────────────────────
    const connection = await Connection.create({
      sender:   senderId,
      receiver: receiverId,
    });

    res.status(201).json({
      success: true,
      message: "Connection request sent",
      connection,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const reviewRequest = async (req, res) => {
    try {
      const loggedInUserId = req.user._id;
      const { connectionId, status } = req.params;
  
      // ─── VALIDATE STATUS ──────────────────────────────────
      const allowedStatus = ["accepted", "ignored"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be accepted or ignored",
        });
      }
  
      const connection = await Connection.findOne({
        _id:      connectionId,
        receiver: loggedInUserId,
        status:   "pending",
      });
  
      if (!connection) {
        return res.status(404).json({
          success: false,
          message: "Connection request not found",
        });
      }
  
      if (status === "ignored") {
        await connection.deleteOne();

        return res.status(200).json({
          success: true,
          message: "Connection request ignored",
        });
      }

      connection.status = status;
      await connection.save();
  
      res.status(200).json({
        success: true,
        message: `Connection request ${status}`, // ✅ dynamic message
        connection,
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
};

// @DELETE /api/connections/:id
export const removeConnection = async (req, res) => {
    try {

      const { connectionId } = req.params;

      const connection = await Connection.findOne({
        _id: connectionId,
        $or: [
          { sender:   req.user._id },
          { receiver: req.user._id },
        ],
      });
  
      // ─── CHECK EXISTS ─────────────────────────────────────
      if (!connection) {
        return res.status(404).json({
          success: false,
          message: "Connection not found",
        });
      }
  
      await connection.deleteOne();
  
      res.status(200).json({
        success: true,
        message: "Connection removed",
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  // @GET /api/connections
export const getConnections = async (req, res) => {
    try {
      const connections = await Connection.find({
        $or: [
          { sender:   req.user._id },
          { receiver: req.user._id },
        ],
        status: "accepted",
      })
        .populate("sender",   "name avatar headline skills isOnline lastSeen subscription")
        .populate("receiver", "name avatar headline skills isOnline lastSeen subscription")
        .sort({ updatedAt: -1 });// recently active first — connections, chats
  
      // ─── RETURN THE OTHER PERSON ───────────────────────────
      const result = connections.map((c) => {
        const other =
          c.sender._id.toString() === req.user._id.toString()
            ? c.receiver  // i am sender → return receiver
            : c.sender;   // i am receiver → return sender
        return {
          connectionId: c._id,
          user:         other,
          connectedAt:  c.updatedAt,
        };
      });
  
      res.status(200).json({
        success:     true,
        connections: result,
        total:       result.length,
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

// @GET /api/connections/requests
export const getRequests = async (req, res) => {
    try {
      const requests = await Connection.find({
        receiver: req.user._id,
        status:   "pending",
      })
        .populate("sender", "name avatar headline skills availability subscription")
        .sort({ createdAt: -1 });
  
      res.status(200).json({
        success:  true,
        requests,
        total:    requests.length,
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

// @GET /api/connections/sent
export const getSentRequests = async (req, res) => {
    try {
      const requests = await Connection.find({
        sender: req.user._id,
        status: "pending",
      })
        .populate("receiver", "name avatar headline skills availability subscription")
        .sort({ createdAt: -1 });
  
      res.status(200).json({
        success:  true,
        requests,
        total:    requests.length,
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
