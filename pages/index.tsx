import type {NextPage} from 'next'
import Head from 'next/head'
import RegularLayout from "../models/frontEnd/regularLayout";
import {useRouter} from "next/router";
import styles from "../styles/Home.module.css"

const Home: NextPage = () => {

    const router = useRouter();
    return (
        <>
            <Head>
                <title>Learnopedia</title>
                <meta name={"description"} content={"A great open community of learners where you can take a wide range of courses and create your own content."}/>
                <meta name={"keywords"} content={"Learnopedia, Learning, Course, Courses, Online, Create, Edit, Modify"}/>
            </Head>
            <RegularLayout enforceUser={false} noInlineNav={false}>
                <div className={styles.limitedSize}>
                    <h1><b>Welcome to Learnopedia!</b></h1>
                    <p>A great open community of learners where you can take a wide range of courses and create your own content.</p>
                    <hr/>
                    <h2>Learn</h2>
                    <p>
                        The wide range of course on Learnopedia platform allow you to learn, using course created by our vibrant community! 👩‍🎓
                    </p>
                    <hr/>
                    <h2>Create</h2>
                    <p>
                        Learnopedia allows <b>anyone</b>* to create their own courses, no prior knowledge need! Except for... the knowledge in the subject of course 😂
                    </p>
                    <hr/>
                    <h2>Modify</h2>
                    <p>
                        See something that can be improved? Or something not entirely right? No more back and forth with the creator! Just press the edit button to correct anything! 🤓
                    </p>
                    <hr/>
                    <h2>Contribute</h2>
                    <p>
                        All edits and creation of new content is awarded with XP points. Lets get leveling! 🎮
                    </p>
                    <hr/>
                    <p style={{textAlign: "right"}}><i>*you need to register to create/edit content on Learnopedia</i></p>

                    <h2>Now, time for your action:</h2>
                    <button className={"buttonNice"} onClick={() => {
                        router.push("/register")
                    }}>Register
                    </button>
                    <br/><br/>
                    <button className={"buttonNice"} onClick={() => {
                        router.push("/login")
                    }}>Log In
                    </button>
                    <br/><br/>
                    <button className={"buttonNice"} onClick={() => {
                        router.push("/edit/createCourse")
                    }}>Create a Course
                    </button>
                    <br/><br/>
                </div>
            </RegularLayout>
        </>

    )
}

export default Home
