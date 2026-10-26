import express from 'express';
import { protect } from '../middlewares/auth.js';
import { getConnections, getRequests, getSentRequests, removeConnection, reviewRequest, sendRequest } from '../controllers/connectionController.js';

const connectionRouter = express.Router();

connectionRouter.post("/send/:userId",protect,sendRequest);

connectionRouter.patch("/review/:status/:connectionId",protect,reviewRequest);

connectionRouter.delete("/remove/:connectionId",protect,removeConnection);

connectionRouter.get("/",protect,getConnections);

connectionRouter.get("/requests", protect, getRequests);

connectionRouter.get("/sent", protect, getSentRequests);

export default connectionRouter;