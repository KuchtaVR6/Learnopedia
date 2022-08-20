import {InvalidArgument} from "../../tools/Errors";

class Keyword {
    private id : number;
    private readonly score : number;
    private readonly word : string;

    public constructor(id : number, score : number, word : string) {
        if(score<1 || score>100)
        {
            throw new InvalidArgument(score.toString(),"Is within <1,100>.")
        }
        if(score%1!==0)
        {
            throw new InvalidArgument(score.toString(), "Is a natural number.")
        }
        if(word.length>20)
        {
            throw new InvalidArgument(word.toString(), "Is not longer than 20 characters.")
        }
        if(word.length<3)
        {
            throw new InvalidArgument(word.toString(), "Is no shorter than 3 characters.")
        }
        if(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ ]/g.test(word))
        {
            throw new InvalidArgument(word.toString(), "Contains special characters or spaces")
        }
        if(word.toLowerCase() !== word)
        {
            throw new InvalidArgument(word.toString(), "Must be all lower case letter")
        }

        this.id = id;
        this.score = score;
        this.word = word;
    }

    public getWord()
    {
        return this.word
    }

    public getScore()
    {
        return this.score
    }

    public getID()
    {
        return this.id
    }

    public setID(id : number)
    {
        this.id = id
    }
}

export class ActiveKeyword extends Keyword{
    private readonly contentID : number;

    public constructor(id: number, score : number, word : string, contentID : number) {
        super(id, score, word);
        this.contentID = contentID;
    }

    public getContentID() {
        return this.contentID;
    }
}

export default Keyword;