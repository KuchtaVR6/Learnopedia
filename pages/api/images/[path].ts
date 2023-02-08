import nc from "next-connect";
import {NextApiRequest, NextApiResponse} from "next";
import fs from "fs";
import path from "path";

const apiRoute = nc({
    onNoMatch(req: NextApiRequest, res: NextApiResponse) {
        res.status(405).json({error: `Method '${req.method}' Not Allowed`});
    },
});

// Process a POST request
apiRoute.get(async (req: NextApiRequest, res: NextApiResponse) => {

    // find the link of the other API
    if(req.url) {
        try{
            let myPath = req.url.split("/api/images")

            let fullPath = path.resolve(__dirname, "../../../../../public/uploads/"+myPath[1])

            const { size } = fs.statSync(fullPath);

            res.writeHead(200, {
                'Content-Type': `image/${path.extname(myPath[1]).replace(".","")}`,
                'Content-Disposition' : 'inline',
                'Content-Length': size,
            });

            fs.createReadStream(fullPath).pipe(res)

            res.status(200);
        }
        catch (e) {
            res.status(404).json({message: "Image not found."})
        }
    }
})

export default apiRoute;