import nc from 'next-connect';
import {NextApiRequest, NextApiResponse} from "next";
import multer from 'multer';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

const index = multer({
    storage: multer.diskStorage({
        destination: './public/uploads/avatars',
        filename: (req, file, cb) => cb(null, file.fieldname + "_" + Date.now() + '.' + file.mimetype.split('/')[1]),
    }),
    limits: {fileSize: MAX_IMAGE_SIZE}
});

const apiRoute = nc({
    onNoMatch(req: NextApiRequest, res: NextApiResponse) {
        res.status(405).json({error: `Method '${req.method}' Not Allowed`});
    },
});
const uploadMiddleware = index.single('avatar');

apiRoute.use(uploadMiddleware);

// Process a POST request
apiRoute.post(async (req: NextApiRequest & { file: { filename: string } }, res: NextApiResponse) => {

    // find the link of the other API
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const baseUrl = `${protocol}://${req.headers['host']}`

    console.log(req.file.filename)

    console.log(req.cookies)

    const resp = await fetch(baseUrl + '/api/graphql', {
        method: 'POST',

        headers: {
            "Content-Type": "application/json",
            Cookie: `initialToken=${req.cookies.initialToken};accessToken=${req.cookies.accessToken};refreshToken=${req.cookies.refreshToken};`,
            "User-Agent": req.headers["user-agent"]!
        },

        body: JSON.stringify({
            query: `mutation Mutation($newPath: String) {
                        avatarFinalise(newPath: $newPath) {
                            continue
                            }
                        }`,
            variables: {
                newPath: req.file.filename
            }
        })
    })

    console.log("finished")

    let response = (JSON.parse(await resp.text()))

    console.log(response)

    if (response.errors) {
        res.status(200).json({success: false, message: 'Unexpected Error'})
    }

    res.status(200).json({success: true, file: req.file.filename});
})

export default apiRoute;

export const config = {
    api: {
        bodyParser: false, // Disallow body parsing, consume as stream for images
    },
};