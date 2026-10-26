import Chat from "../models/chat.js";
import Connection from "../models/connection.js";
import User from "../models/user.js";

const userPreviewFields = "name avatar headline subscription isOnline lastSeen";

const ensureAcceptedConnection = async (userId, targetUserId) =>
  Connection.findOne({
    $or: [
      { sender: userId, receiver: targetUserId },
      { sender: targetUserId, receiver: userId },
    ],
    status: "accepted",
  });

const getOtherUser = (participants, currentUserId) =>
  participants.find(
    (participant) => participant._id.toString() !== currentUserId.toString()
  );

export const getChatList = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate("participants", userPreviewFields)
      .sort({ updatedAt: -1 });

    const items = chats
      .map((chat) => {
        const otherUser = getOtherUser(chat.participants, req.user._id);

        if (!otherUser) return null;

        const lastMessage = chat.messages[chat.messages.length - 1];

        return {
          _id: chat._id,
          otherUser,
          lastMessage: lastMessage?.text || "",
          lastMessageAt: lastMessage?.createdAt || chat.updatedAt,
        };
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      chats: items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrCreateChat = async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot chat with yourself",
      });
    }

    const targetUser = await User.findById(targetUserId).select(userPreviewFields);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isConnected = await ensureAcceptedConnection(req.user._id, targetUserId);
    if (!isConnected) {
      return res.status(403).json({
        success: false,
        message: "You can chat only with accepted connections",
      });
    }

    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, targetUserId] },
    }).populate("messages.senderId", userPreviewFields);

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user._id, targetUserId],
        messages: [],
      });

      chat = await Chat.findById(chat._id).populate(
        "messages.senderId",
        userPreviewFields
      );
    }

    let hasSeenUpdates = false;
    chat.messages.forEach((message) => {
      if (
        message.senderId?._id?.toString() === targetUserId &&
        !message.seen
      ) {
        message.seen = true;
        message.seenAt = new Date();
        hasSeenUpdates = true;
      }
    });

    if (hasSeenUpdates) {
      await chat.save();
      await chat.populate("messages.senderId", userPreviewFields);
    }

    res.status(200).json({
      success: true,
      chat: {
        _id: chat._id,
        targetUser,
        messages: chat.messages,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
