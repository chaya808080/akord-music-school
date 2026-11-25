CREATE TABLE [Courses] (
    [codeOfCourse] int NOT NULL IDENTITY,
    [nameOfCourse] nvarchar(20) NOT NULL,
    [sexOfCourse] nvarchar(10) NOT NULL,
    [priceOfCourse] float NOT NULL,
    [descriptionOfCourse] nvarchar(max) NULL,
    [duretionTimeOfCourse] int NULL DEFAULT 30,
    [fromAge] int NULL,
    [toAge] int NULL,
    CONSTRAINT [PK__tmp_ms_x__E46A8273BA9AE414] PRIMARY KEY ([codeOfCourse])
);
GO


CREATE TABLE [Family] (
    [codeFamily] int NOT NULL IDENTITY,
    [lastName] nchar(20) NOT NULL,
    [address] nchar(30) NULL,
    [phone] nchar(10) NOT NULL,
    [mail] nchar(20) NULL,
    [paiy] nchar(30) NULL,
    CONSTRAINT [PK__tmp_ms_x__85C94195A4568F42] PRIMARY KEY ([codeFamily])
);
GO


CREATE TABLE [Reason] (
    [codeReason] int NOT NULL IDENTITY,
    [discribeReason] nchar(70) NULL,
    CONSTRAINT [PK__Reason__26E58983BBFF2195] PRIMARY KEY ([codeReason])
);
GO


CREATE TABLE [StudentIsAbsent] (
    [StudentIsAbsentCode] int NOT NULL,
    [studentCode] int NOT NULL,
    [fromDate] date NULL,
    [toDate] date NULL,
    [reasonAbsentS] nchar(70) NULL,
    [codeReasonAbsentS] int NULL,
    CONSTRAINT [PK__StudentI__9AE3C40A2974C544] PRIMARY KEY ([StudentIsAbsentCode])
);
GO


CREATE TABLE [Teachers] (
    [codeOfTeacher] int NOT NULL IDENTITY,
    [idOfTeacher] nchar(10) NOT NULL,
    [firstNameOfTeacher] nvarchar(20) NOT NULL,
    [lastNameOfTeacher] nchar(15) NOT NULL,
    [phoneOfTeacher] nchar(10) NOT NULL,
    [mail] nchar(25) NULL,
    [actOrNot] nchar(20) NULL DEFAULT N'true',
    [sexOfTeacher] nchar(10) NULL,
    [comentTeacher] nchar(30) NULL,
    CONSTRAINT [PK__tmp_ms_x__DA35BB01651E7505] PRIMARY KEY ([codeOfTeacher])
);
GO


CREATE TABLE [Students] (
    [codeOfStudent] int NOT NULL IDENTITY,
    [idOfStudents] int NOT NULL,
    [codeFamily] int NOT NULL,
    [firstName] nchar(30) NOT NULL,
    [birsDate] date NULL,
    [beginDate] date NULL,
    [countLessonAct] int NULL,
    [fixLesson] int NULL DEFAULT 0,
    [actOrWaitOrFinish] nchar(10) NULL,
    [finishDate] date NULL,
    [coments] nchar(40) NULL,
    [k.ch] nchar(15) NULL,
    [sexOfStudent] nvarchar(max) NULL,
    CONSTRAINT [PK__tmp_ms_x__8B071A592282E974] PRIMARY KEY ([codeOfStudent]),
    CONSTRAINT [FK_Students_ToTable] FOREIGN KEY ([codeFamily]) REFERENCES [Family] ([codeFamily])
);
GO


CREATE TABLE [EndTeacher] (
    [codeEndTeacher] int NOT NULL,
    [codeOfTeacher] int NOT NULL,
    [codeOfCourse] int NULL,
    [reasonEnd] nchar(70) NULL,
    [codeReasonEndT] int NULL,
    [BeginDate] date NULL,
    CONSTRAINT [PK__EndTeach__0F71F7EFD4C75205] PRIMARY KEY ([codeEndTeacher]),
    CONSTRAINT [FK_EndTeacher_ToTable] FOREIGN KEY ([codeOfTeacher]) REFERENCES [Teachers] ([codeOfTeacher]),
    CONSTRAINT [FK_EndTeacher_ToTable_1] FOREIGN KEY ([codeOfCourse]) REFERENCES [Courses] ([codeOfCourse]),
    CONSTRAINT [FK_EndTeacher_ToTable_2] FOREIGN KEY ([codeReasonEndT]) REFERENCES [Reason] ([codeReason])
);
GO


CREATE TABLE [teacherIsAbsent] (
    [teacherIsAbsentCode] int NOT NULL,
    [codeOfTeacher] int NOT NULL,
    [fromDate] date NULL,
    [toDate] date NULL,
    [codeReasonAbsentT] int NULL,
    [reasonAbsentT] nchar(70) NULL,
    CONSTRAINT [PK__teacherI__20A151C31ABBE60F] PRIMARY KEY ([teacherIsAbsentCode]),
    CONSTRAINT [FK_teacherIsAbsent_ToTable] FOREIGN KEY ([codeOfTeacher]) REFERENCES [Teachers] ([codeOfTeacher]),
    CONSTRAINT [FK_teacherIsAbsent_ToTable_1] FOREIGN KEY ([codeReasonAbsentT]) REFERENCES [Reason] ([codeReason])
);
GO


CREATE TABLE [TeachersOfCourses] (
    [codeTC] int NOT NULL IDENTITY,
    [codeOfTeacherTC] int NOT NULL,
    [codeOfCourseTC] int NOT NULL,
    CONSTRAINT [PK__Teachers__47F9697FBD919BE8] PRIMARY KEY ([codeTC]),
    CONSTRAINT [FK_TeachersOfCourses_ToTable] FOREIGN KEY ([codeOfTeacherTC]) REFERENCES [Teachers] ([codeOfTeacher]),
    CONSTRAINT [FK_TeachersOfCourses_ToTable_1] FOREIGN KEY ([codeOfCourseTC]) REFERENCES [Courses] ([codeOfCourse])
);
GO


CREATE TABLE [AnnualHoursSystem] (
    [annualHoursSystemCode] int NOT NULL,
    [teacherCode] int NOT NULL,
    [studentCode] int NOT NULL,
    [date] date NULL,
    [dayInWeek] nchar(10) NULL,
    [hour] time NULL,
    [Status] nchar(10) NULL,
    CONSTRAINT [PK__AnnualHo__D6E011140163A436] PRIMARY KEY ([annualHoursSystemCode]),
    CONSTRAINT [FK_AnnualHoursSystem_ToTable] FOREIGN KEY ([teacherCode]) REFERENCES [Teachers] ([codeOfTeacher]),
    CONSTRAINT [FK_AnnualHoursSystem_ToTable_1] FOREIGN KEY ([studentCode]) REFERENCES [Students] ([codeOfStudent])
);
GO


CREATE TABLE [EndStudent] (
    [codeEndStudent] int NOT NULL,
    [codeSudent] int NOT NULL,
    [codeCours] int NULL,
    [codeReasonEndS] int NULL,
    [reasonEndS] nchar(70) NULL,
    CONSTRAINT [PK__EndStude__D635CF17F9B84616] PRIMARY KEY ([codeEndStudent]),
    CONSTRAINT [FK_EndStudent_ToTable] FOREIGN KEY ([codeSudent]) REFERENCES [Students] ([codeOfStudent]),
    CONSTRAINT [FK_EndStudent_ToTable_1] FOREIGN KEY ([codeCours]) REFERENCES [Courses] ([codeOfCourse]),
    CONSTRAINT [FK_EndStudent_ToTable_2] FOREIGN KEY ([codeReasonEndS]) REFERENCES [Reason] ([codeReason])
);
GO


CREATE TABLE [StudentsOfCourses] (
    [codeSC] int NOT NULL IDENTITY,
    [codeOfStudentSC] int NOT NULL,
    [codeOfCourseSC] int NOT NULL,
    [codeOfTeacherSC] int NULL,
    CONSTRAINT [PK__Students__47F9709CE3EC5262] PRIMARY KEY ([codeSC]),
    CONSTRAINT [FK_StudentsOfCourses_ToTable] FOREIGN KEY ([codeOfTeacherSC]) REFERENCES [Teachers] ([codeOfTeacher]),
    CONSTRAINT [FK_StudentsOfCourses_ToTable_1] FOREIGN KEY ([codeOfStudentSC]) REFERENCES [Students] ([codeOfStudent]),
    CONSTRAINT [FK_StudentsOfCourses_ToTable_2] FOREIGN KEY ([codeOfCourseSC]) REFERENCES [Courses] ([codeOfCourse])
);
GO


CREATE TABLE [studentWaiting] (
    [studentWaitingCode] int NOT NULL,
    [studentCode] int NOT NULL,
    [courseCode] int NULL,
    [waitingDate] date NULL,
    [waitingReasonCode] int NULL,
    [waitingReason] nchar(70) NULL,
    CONSTRAINT [PK__studentW__FE89E623B314134F] PRIMARY KEY ([studentWaitingCode]),
    CONSTRAINT [FK_studentWaiting_ToTable] FOREIGN KEY ([studentCode]) REFERENCES [Students] ([codeOfStudent]),
    CONSTRAINT [FK_studentWaiting_ToTable_2] FOREIGN KEY ([waitingReasonCode]) REFERENCES [Reason] ([codeReason]),
    CONSTRAINT [FK_studentWaiting_ToTable_3] FOREIGN KEY ([courseCode]) REFERENCES [Courses] ([codeOfCourse])
);
GO


CREATE INDEX [IX_AnnualHoursSystem_studentCode] ON [AnnualHoursSystem] ([studentCode]);
GO


CREATE INDEX [IX_AnnualHoursSystem_teacherCode] ON [AnnualHoursSystem] ([teacherCode]);
GO


CREATE INDEX [IX_EndStudent_codeCours] ON [EndStudent] ([codeCours]);
GO


CREATE INDEX [IX_EndStudent_codeReasonEndS] ON [EndStudent] ([codeReasonEndS]);
GO


CREATE INDEX [IX_EndStudent_codeSudent] ON [EndStudent] ([codeSudent]);
GO


CREATE INDEX [IX_EndTeacher_codeOfCourse] ON [EndTeacher] ([codeOfCourse]);
GO


CREATE INDEX [IX_EndTeacher_codeOfTeacher] ON [EndTeacher] ([codeOfTeacher]);
GO


CREATE INDEX [IX_EndTeacher_codeReasonEndT] ON [EndTeacher] ([codeReasonEndT]);
GO


CREATE INDEX [IX_Students_codeFamily] ON [Students] ([codeFamily]);
GO


CREATE INDEX [IX_StudentsOfCourses_codeOfCourseSC] ON [StudentsOfCourses] ([codeOfCourseSC]);
GO


CREATE INDEX [IX_StudentsOfCourses_codeOfStudentSC] ON [StudentsOfCourses] ([codeOfStudentSC]);
GO


CREATE INDEX [IX_StudentsOfCourses_codeOfTeacherSC] ON [StudentsOfCourses] ([codeOfTeacherSC]);
GO


CREATE INDEX [IX_studentWaiting_courseCode] ON [studentWaiting] ([courseCode]);
GO


CREATE INDEX [IX_studentWaiting_studentCode] ON [studentWaiting] ([studentCode]);
GO


CREATE INDEX [IX_studentWaiting_waitingReasonCode] ON [studentWaiting] ([waitingReasonCode]);
GO


CREATE INDEX [IX_teacherIsAbsent_codeOfTeacher] ON [teacherIsAbsent] ([codeOfTeacher]);
GO


CREATE INDEX [IX_teacherIsAbsent_codeReasonAbsentT] ON [teacherIsAbsent] ([codeReasonAbsentT]);
GO


CREATE INDEX [IX_TeachersOfCourses_codeOfCourseTC] ON [TeachersOfCourses] ([codeOfCourseTC]);
GO


CREATE INDEX [IX_TeachersOfCourses_codeOfTeacherTC] ON [TeachersOfCourses] ([codeOfTeacherTC]);
GO


