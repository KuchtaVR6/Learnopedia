This is the code for the Learnopedia platform.
## Deployed version:
***You can use this link: https://learnopedia.kuchta.uk/***

## Manual Hosting:

First, run the development server you need to have **Node Package Manager** ***NPM*** installed and Node 
<br/>
*(if errors are encountered please install version: v18.15.0).*
<br/>
Additionally, if you don't have yarn install run:
```bash
npm install --global yarn
```
Afterwards run this command:
```bash
yarn install
```
If it fails, please run these commands:
```bash
yarn remove bcrypt
yarn install
yarn add bcrypt
yarn install
```
At this point all the required dependencies are installed 😀!
<br/>
### Now for the Database:<br/>
You need a database environment (I recommend XAMPP or equivalent for your system).
<br/>
*instructions in italics are optional but can save time*
<br/>
**Create a MySQL database,** *you can all it learnopedia, run it on port 3306.*
<br/>
**Create a user with privalages allowing the to change the database (development only, permissions must be restricted in production)**
*you can all it prisma, set its password as HeyHiHello.*
<br/>
If you have followed all instructions in *italics* you can skip to the final step, otherwise in the file .env change the line 7 to:
```dotenv
DATABASE_URL="mysql://username:password@localhost:portnumber/database_name"
```
Where username, password, portnumber and database_name have been replaced with the once you have chosen.
<br/>
**Final Step**
Run
```bash
prisma db push
prisma generate
```
And the database is ready 🥳.
<br/>
Now, **simply run**:
```bash
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


