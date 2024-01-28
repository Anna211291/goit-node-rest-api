import jimp from "jimp";
import { HttpError } from "../helpers/index.js";

const resizeAvatar = async(req, res, next) => {
   try {
        if(req.file) {
            const image = await jimp.read(req.file.path);
            image.resize(250, 250, jimp.RESIZE_BILINEAR);
            await image.writeAsync(req.file.path);
        }
        next();
   } catch (error) {
        next(HttpError(401, error.message));
   }
};

export default resizeAvatar; 