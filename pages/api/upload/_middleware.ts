
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req : NextRequest) {

    // find the link of the other API
    const protocol = req.headers.get('x-forwarded-proto') || 'http'
    const baseUrl = `${protocol}://${req.headers.get('host')}`

    const resp = await fetch(baseUrl + '/api/graphql', {
        method: 'POST',

        headers: {
            "Content-Type": "application/json",
            Cookie: `accessToken=${req.cookies.accessToken};refreshToken=${req.cookies.refreshToken};initialToken=${req.cookies.initialToken};`,
            "User-Agent": req.headers.get("user-agent")!
        },

        body: JSON.stringify({
            query: `query ExampleQuery {
                avatarAuthorise {
                    file
                }
            }`
        })
    })

    let response = (JSON.parse(await resp.text()))

    if (response.errors)
    {
        return new NextResponse(JSON.stringify({success: false, message: 'Session has been invalidated.'}), {
            status: 200,
            headers: {'content-type': 'application/json'}
        })
    }

    return NextResponse.next();
}