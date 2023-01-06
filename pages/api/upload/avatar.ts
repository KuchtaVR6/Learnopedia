import nc from 'next-connect';
import {NextApiRequest, NextApiResponse} from "next";
import multer from 'multer';

const MAX_IMAGE_SIZE=2 * 1024 * 1024; // 2 MB

const index = multer({
    storage: multer.diskStorage({
        destination: './public/uploads/avatars',
        filename: (req, file, cb) => cb(null, file.fieldname + "_" + Date.now() + '.' + file.mimetype.split('/')[1]),
    }),
    limits: {fileSize: MAX_IMAGE_SIZE}
});

const apiRoute = nc({
    onNoMatch(req : NextApiRequest, res : NextApiResponse) {
        res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
    },
});
const uploadMiddleware = index.single('avatar');

apiRoute.use(uploadMiddleware);

// Process a POST request
apiRoute.post((req : NextApiRequest, res: NextApiResponse) => {
    res.status(200).json({data: 'success'});
})

export default apiRoute;

export const config = {
    api: {
        bodyParser: false, // Disallow body parsing, consume as stream for images
    },
};