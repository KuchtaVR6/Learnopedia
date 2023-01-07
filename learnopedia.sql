CREATE TABLE `User` (
  ID         int(11) NOT NULL AUTO_INCREMENT, 
  nickname   varchar(255) NOT NULL UNIQUE, 
  email      varchar(255) NOT NULL UNIQUE, 
  fname      varchar(255) NOT NULL, 
  lname      varchar(255) NOT NULL, 
  passHash   varchar(255) NOT NULL, 
  avatarFile varchar(255), 
  PRIMARY KEY (ID));
CREATE TABLE Amendment (
  ID           int(11) NOT NULL AUTO_INCREMENT, 
  CreatorID    int(11), 
  timestamp    datetime NOT NULL, 
  ContentID    int(11), 
  significance int(11) NOT NULL, 
  tariff       int(11) NOT NULL, 
  applied      bit(1) NOT NULL, 
  PRIMARY KEY (ID));
CREATE TABLE PartAmendment (
  AmendmentID  int(11) NOT NULL, 
  LessonPartID int(11), 
  PRIMARY KEY (AmendmentID));
CREATE TABLE MetaAmendment (
  AmendmentID    int(11) NOT NULL, 
  newName        varchar(255), 
  newDescription varchar(255), 
  PRIMARY KEY (AmendmentID));
CREATE TABLE Content (
  ID           int(11) NOT NULL AUTO_INCREMENT, 
  name         varchar(255) NOT NULL, 
  description  varchar(255) NOT NULL, 
  views        int(11) NOT NULL, 
  upVotes      int(11) NOT NULL, 
  downVotes    int(11) NOT NULL, 
  dateModified datetime NOT NULL, 
  dateCreated  datetime NOT NULL, 
  seqNumber    int(11) NOT NULL, 
  `public`     bit(1) NOT NULL, 
  type         varchar(255) NOT NULL, 
  PRIMARY KEY (ID));
CREATE TABLE Course (
  CourseID  int(11) NOT NULL AUTO_INCREMENT, 
  ContentID int(11) NOT NULL UNIQUE, 
  PRIMARY KEY (CourseID));
CREATE TABLE Chapter (
  ChapterID int(11) NOT NULL AUTO_INCREMENT, 
  ContentID int(11) NOT NULL UNIQUE, 
  CourseID  int(11) NOT NULL, 
  PRIMARY KEY (ChapterID));
CREATE TABLE Lesson (
  LessonID  int(11) NOT NULL AUTO_INCREMENT, 
  ContentID int(11) NOT NULL UNIQUE, 
  ChapterID int(11) NOT NULL, 
  PRIMARY KEY (LessonID));
CREATE TABLE LessonPart (
  LessonPartID int(11) NOT NULL AUTO_INCREMENT, 
  LessonID     int(11), 
  seqNumber    int(11) NOT NULL, 
  PRIMARY KEY (LessonPartID));
CREATE TABLE Paragraph (
  LessonPartID int(11) NOT NULL, 
  basicText    varchar(1000) NOT NULL, 
  advancedText varchar(1000), 
  PRIMARY KEY (LessonPartID));
CREATE TABLE Figure (
  LessonPartID int(11) NOT NULL, 
  PRIMARY KEY (LessonPartID));
CREATE TABLE SubFigure (
  ID          int(11) NOT NULL AUTO_INCREMENT, 
  FigureID    int(11) NOT NULL, 
  path        varchar(255) NOT NULL, 
  XOffset     int(11), 
  YOffset     int(11), 
  name        varchar(255), 
  description varchar(500), 
  PRIMARY KEY (ID));
CREATE TABLE Video (
  LessonPartID int(11) NOT NULL, 
  url          varchar(255) NOT NULL, 
  PRIMARY KEY (LessonPartID));
CREATE TABLE ProtocolSnippet (
  LessonPartID int(11) NOT NULL, 
  language     varchar(255), 
  content      varchar(500) NOT NULL, 
  PRIMARY KEY (LessonPartID));
CREATE TABLE CreationAmendment (
  AmendmentID    int(11) NOT NULL, 
  newName        varchar(255) NOT NULL, 
  newDescription varchar(255) NOT NULL, 
  newParent      int(11), 
  seqNumber      int(11) NOT NULL, 
  PRIMARY KEY (AmendmentID));
CREATE TABLE ListAmendment (
  AmendmentID int(11) NOT NULL, 
  PRIMARY KEY (AmendmentID));
CREATE TABLE AdoptionAmendment (
  AmendmentID       int(11) NOT NULL, 
  newParent         int(11), 
  receiverAmendment int(11), 
  PRIMARY KEY (AmendmentID));
CREATE TABLE Keyword (
  ID        int(11) NOT NULL AUTO_INCREMENT, 
  ContentID int(11), 
  word      varchar(255) NOT NULL, 
  Score     int(11) NOT NULL, 
  PRIMARY KEY (ID));
CREATE TABLE KeywordEntryMod (
  ID          int(11) NOT NULL, 
  AmendmentID int(11) NOT NULL, 
  KeywordID   int(11), 
  newWord     varchar(255), 
  score       int(11), 
  `delete`    bit(1), 
  PRIMARY KEY (ID, 
  AmendmentID));
CREATE TABLE KeywordModAmendment (
  AmendmentID int(11) NOT NULL, 
  PRIMARY KEY (AmendmentID));
CREATE TABLE ContentListMod (
  ID           int(11) NOT NULL AUTO_INCREMENT, 
  AmendmentID  int(11), 
  ChildID      int(11), 
  LessonPartID int(11), 
  newSeqNumber int(11), 
  `delete`     bit(1), 
  PRIMARY KEY (ID));
CREATE TABLE PartAddReplaceAmendment (
  AmendmentID int(11) NOT NULL, 
  OldPartID   int(11), 
  seqNumber   int(11) NOT NULL, 
  PRIMARY KEY (AmendmentID));
CREATE TABLE `Session` (
  UserID      int(11) NOT NULL UNIQUE, 
  timestamp   datetime NOT NULL UNIQUE, 
  invalidated bit(1) NOT NULL, 
  userAgent   varchar(255) NOT NULL, 
  TTL         int(11) NOT NULL, 
  PRIMARY KEY (UserID, 
  timestamp));
CREATE TABLE AccessToken (
  token            varchar(255) NOT NULL, 
  SessionUserID    int(11) NOT NULL, 
  Sessiontimestamp datetime NOT NULL, 
  timestamp        datetime NOT NULL, 
  TTL              int(11) NOT NULL, 
  PRIMARY KEY (token));
ALTER TABLE PartAmendment ADD CONSTRAINT FKPartAmendm644504 FOREIGN KEY (AmendmentID) REFERENCES Amendment (ID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE Amendment ADD CONSTRAINT FKAmendment140140 FOREIGN KEY (CreatorID) REFERENCES `User` (ID) ON UPDATE Cascade ON DELETE Set null;
ALTER TABLE Amendment ADD CONSTRAINT FKAmendment887662 FOREIGN KEY (ContentID) REFERENCES Content (ID) ON UPDATE Cascade ON DELETE Set null;
ALTER TABLE Course ADD CONSTRAINT FKCourse342777 FOREIGN KEY (ContentID) REFERENCES Content (ID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE Chapter ADD CONSTRAINT FKChapter222112 FOREIGN KEY (ContentID) REFERENCES Content (ID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE Lesson ADD CONSTRAINT FKLesson260152 FOREIGN KEY (ContentID) REFERENCES Content (ID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE PartAmendment ADD CONSTRAINT FKPartAmendm643663 FOREIGN KEY (LessonPartID) REFERENCES LessonPart (LessonPartID) ON UPDATE Cascade ON DELETE Set null;
ALTER TABLE Chapter ADD CONSTRAINT FKChapter463302 FOREIGN KEY (CourseID) REFERENCES Course (CourseID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE Lesson ADD CONSTRAINT FKLesson585002 FOREIGN KEY (ChapterID) REFERENCES Chapter (ChapterID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE LessonPart ADD CONSTRAINT FKLessonPart139108 FOREIGN KEY (LessonID) REFERENCES Lesson (LessonID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE Paragraph ADD CONSTRAINT FKParagraph124725 FOREIGN KEY (LessonPartID) REFERENCES LessonPart (LessonPartID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE Figure ADD CONSTRAINT FKFigure783054 FOREIGN KEY (LessonPartID) REFERENCES LessonPart (LessonPartID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE Video ADD CONSTRAINT FKVideo763583 FOREIGN KEY (LessonPartID) REFERENCES LessonPart (LessonPartID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE ProtocolSnippet ADD CONSTRAINT FKProtocolSn123813 FOREIGN KEY (LessonPartID) REFERENCES LessonPart (LessonPartID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE SubFigure ADD CONSTRAINT FKSubFigure388707 FOREIGN KEY (FigureID) REFERENCES Figure (LessonPartID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE ListAmendment ADD CONSTRAINT FKListAmendm321674 FOREIGN KEY (AmendmentID) REFERENCES Amendment (ID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE Keyword ADD CONSTRAINT FKKeyword323953 FOREIGN KEY (ContentID) REFERENCES Content (ID) ON UPDATE Cascade ON DELETE Set null;
ALTER TABLE KeywordEntryMod ADD CONSTRAINT FKKeywordEnt354952 FOREIGN KEY (KeywordID) REFERENCES Keyword (ID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE CreationAmendment ADD CONSTRAINT FKCreationAm315379 FOREIGN KEY (newParent) REFERENCES Content (ID) ON UPDATE Cascade ON DELETE Set null;
ALTER TABLE AdoptionAmendment ADD CONSTRAINT FKAdoptionAm923671 FOREIGN KEY (AmendmentID) REFERENCES Amendment (ID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE AdoptionAmendment ADD CONSTRAINT FKAdoptionAm410338 FOREIGN KEY (newParent) REFERENCES Content (ID) ON UPDATE Cascade ON DELETE Set null;
ALTER TABLE KeywordModAmendment ADD CONSTRAINT FKKeywordMod848223 FOREIGN KEY (AmendmentID) REFERENCES Amendment (ID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE MetaAmendment ADD CONSTRAINT FKMetaAmendm946708 FOREIGN KEY (AmendmentID) REFERENCES KeywordModAmendment (AmendmentID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE CreationAmendment ADD CONSTRAINT FKCreationAm946974 FOREIGN KEY (AmendmentID) REFERENCES KeywordModAmendment (AmendmentID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE KeywordEntryMod ADD CONSTRAINT FKKeywordEnt546603 FOREIGN KEY (AmendmentID) REFERENCES KeywordModAmendment (AmendmentID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE ContentListMod ADD CONSTRAINT FKContentLis156423 FOREIGN KEY (AmendmentID) REFERENCES ListAmendment (AmendmentID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE ContentListMod ADD CONSTRAINT FKContentLis373697 FOREIGN KEY (ChildID) REFERENCES Content (ID) ON UPDATE Cascade ON DELETE Set null;
ALTER TABLE PartAddReplaceAmendment ADD CONSTRAINT FKPartAddRep747054 FOREIGN KEY (AmendmentID) REFERENCES PartAmendment (AmendmentID) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE PartAddReplaceAmendment ADD CONSTRAINT FKPartAddRep655824 FOREIGN KEY (OldPartID) REFERENCES LessonPart (LessonPartID) ON UPDATE Cascade ON DELETE Set null;
ALTER TABLE ContentListMod ADD CONSTRAINT FKContentLis790003 FOREIGN KEY (LessonPartID) REFERENCES LessonPart (LessonPartID) ON UPDATE Cascade ON DELETE Set null;
ALTER TABLE `Session` ADD CONSTRAINT FKSession127534 FOREIGN KEY (UserID) REFERENCES `User` (ID);
ALTER TABLE AccessToken ADD CONSTRAINT FKAccessToke254924 FOREIGN KEY (SessionUserID, Sessiontimestamp) REFERENCES `Session` (UserID, timestamp);
