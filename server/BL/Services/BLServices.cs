using BL.Models;
using BL.Validation;
using DAL.Api;
using DAL.Models;
using static BL.Validation.Rules;

namespace BL.Services;

public class BLStudentService(IDal dal) : BLCrudService<BLStudent, Student>(dal.Students, "תלמיד")
{
    protected override void SetKey(BLStudent item, int id) => item.CodeOfStudent = id;

    protected override void Normalize(BLStudent item)
    {
        item.ActOrWaitOrFinish = string.IsNullOrWhiteSpace(item.ActOrWaitOrFinish) ? Active : item.ActOrWaitOrFinish.Trim();
        item.BeginDate ??= DateOnly.FromDateTime(DateTime.Today);
        if (item.ActOrWaitOrFinish == Finished) item.FinishDate ??= DateOnly.FromDateTime(DateTime.Today);
    }

    protected override async Task ValidateAsync(BLStudent s, bool isNew)
    {
        Require(!string.IsNullOrWhiteSpace(s.FirstName), "שם התלמיד הוא שדה חובה");
        Require(IsValidIsraeliId(s.IdOfStudents.ToString()), "מספר תעודת הזהות אינו תקין");
        Require(StudentStatuses.Contains(s.ActOrWaitOrFinish), "סטטוס התלמיד חייב להיות פעיל, מחכה או גמר");
        Require(s.BirsDate is null || s.BirsDate <= DateOnly.FromDateTime(DateTime.Today), "תאריך הלידה לא יכול להיות בעתיד");
        Require(s.FinishDate is null || s.BeginDate is null || s.FinishDate >= s.BeginDate, "תאריך הסיום חייב להיות אחרי תאריך ההתחלה");
        Require(await dal.Families.GetByIdAsync(s.CodeFamily) != null, "המשפחה שנבחרה אינה קיימת");

        var sameId = (await dal.Students.GetAllAsync()).Any(o => o.IdOfStudents == s.IdOfStudents && o.CodeOfStudent != s.CodeOfStudent);
        Require(!sameId, "קיים כבר תלמיד עם תעודת הזהות הזו");
    }

    protected override async Task BeforeDeleteAsync(int id)
    {
        var enrolled = (await dal.StudentsOfCourses.GetAllAsync()).Any(e => e.CodeOfStudentSc == id);
        Require(!enrolled, "לא ניתן למחוק תלמיד שרשום לקורס. יש להסיר קודם את הרישום");
    }
}

public class BLFamilyService(IDal dal) : BLCrudService<BLFamily, Family>(dal.Families, "משפחה")
{
    protected override void SetKey(BLFamily item, int id) => item.CodeFamily = id;

    protected override Task ValidateAsync(BLFamily f, bool isNew)
    {
        Require(!string.IsNullOrWhiteSpace(f.LastName), "שם המשפחה הוא שדה חובה");
        Require(IsValidPhone(f.Phone), "מספר הטלפון אינו תקין");
        Require(IsValidEmail(f.Mail), "כתובת המייל אינה תקינה");
        return Task.CompletedTask;
    }

    protected override async Task BeforeDeleteAsync(int id)
    {
        var hasStudents = (await dal.Students.GetAllAsync()).Any(s => s.CodeFamily == id);
        Require(!hasStudents, "לא ניתן למחוק משפחה שיש לה תלמידים רשומים");
    }
}

public class BLTeacherService(IDal dal) : BLCrudService<BLTeacher, Teacher>(dal.Teachers, "מורה")
{
    protected override void SetKey(BLTeacher item, int id) => item.CodeOfTeacher = id;

    protected override void Normalize(BLTeacher item) =>
        item.ActOrNot = string.IsNullOrWhiteSpace(item.ActOrNot) ? "true" : item.ActOrNot.Trim();

    protected override Task ValidateAsync(BLTeacher t, bool isNew)
    {
        Require(!string.IsNullOrWhiteSpace(t.FirstNameOfTeacher) && !string.IsNullOrWhiteSpace(t.LastNameOfTeacher), "שם פרטי ושם משפחה הם שדות חובה");
        Require(IsValidIsraeliId(t.IdOfTeacher), "מספר תעודת הזהות אינו תקין");
        Require(IsValidPhone(t.PhoneOfTeacher), "מספר הטלפון אינו תקין");
        Require(IsValidEmail(t.Mail), "כתובת המייל אינה תקינה");
        return Task.CompletedTask;
    }
}

public class BLCourseService(IDal dal) : BLCrudService<BLCourse, Course>(dal.Courses, "קורס")
{
    protected override void SetKey(BLCourse item, int id) => item.CodeOfCourse = id;

    protected override Task ValidateAsync(BLCourse c, bool isNew)
    {
        Require(!string.IsNullOrWhiteSpace(c.NameOfCourse), "שם הקורס הוא שדה חובה");
        Require(CourseGenders.Contains(c.SexOfCourse?.Trim()), "קהל היעד חייב להיות בנים, בנות או מעורב");
        Require(c.PriceOfCourse > 0, "מחיר הקורס חייב להיות חיובי");
        Require(c.FromAge is null || c.ToAge is null || c.FromAge <= c.ToAge, "טווח הגילאים אינו תקין");
        Require(c.DuretionTimeOfCourse is null or > 0, "משך השיעור חייב להיות חיובי");
        return Task.CompletedTask;
    }

    protected override async Task BeforeDeleteAsync(int id)
    {
        var used = (await dal.StudentsOfCourses.GetAllAsync()).Any(e => e.CodeOfCourseSc == id);
        Require(!used, "לא ניתן למחוק קורס שיש בו תלמידים רשומים");
    }
}

/// <summary>Enrollment of a student in a course - the heart of the domain rules.</summary>
public class BLStudentsOfCourseService(IDal dal) : BLCrudService<BLStudentsOfCourse, StudentsOfCourse>(dal.StudentsOfCourses, "רישום")
{
    protected override void SetKey(BLStudentsOfCourse item, int id) => item.CodeSc = id;

    protected override async Task ValidateAsync(BLStudentsOfCourse e, bool isNew)
    {
        var student = await dal.Students.GetByIdAsync(e.CodeOfStudentSc) ?? throw new BusinessRuleException("התלמיד שנבחר אינו קיים");
        var course = await dal.Courses.GetByIdAsync(e.CodeOfCourseSc) ?? throw new BusinessRuleException("הקורס שנבחר אינו קיים");

        var duplicate = (await dal.StudentsOfCourses.GetAllAsync())
            .Any(o => o.CodeOfStudentSc == e.CodeOfStudentSc && o.CodeOfCourseSc == e.CodeOfCourseSc && o.CodeSc != e.CodeSc);
        Require(!duplicate, "התלמיד כבר רשום לקורס הזה");

        if (student.BirsDate is { } birth)
        {
            var age = AgeOn(birth, DateOnly.FromDateTime(DateTime.Today));
            Require((course.FromAge is null || age >= course.FromAge) && (course.ToAge is null || age <= course.ToAge),
                $"גיל התלמיד ({age}) אינו מתאים לטווח הגילאים של הקורס ({course.FromAge}-{course.ToAge})");
        }
        Require(GenderFits(course.SexOfCourse, student.sexOfStudent), $"הקורס מיועד ל{course.SexOfCourse.Trim()} בלבד");

        if (e.CodeOfTeacherSc is { } teacherId)
        {
            var teaches = (await dal.TeachersOfCourses.GetAllAsync()).Any(t => t.CodeOfTeacherTc == teacherId && t.CodeOfCourseTc == e.CodeOfCourseSc);
            Require(teaches, "המורה שנבחר/ה אינו/ה מלמד/ת את הקורס הזה");
        }
    }
}

public class BLTeachersOfCourseService(IDal dal) : BLCrudService<BLTeachersOfCourse, TeachersOfCourse>(dal.TeachersOfCourses, "שיוך מורה לקורס")
{
    protected override void SetKey(BLTeachersOfCourse item, int id) => item.CodeTc = id;

    protected override async Task ValidateAsync(BLTeachersOfCourse t, bool isNew)
    {
        Require(await dal.Teachers.GetByIdAsync(t.CodeOfTeacherTc) != null, "המורה שנבחר/ה אינו/ה קיים/ת");
        Require(await dal.Courses.GetByIdAsync(t.CodeOfCourseTc) != null, "הקורס שנבחר אינו קיים");
        var duplicate = (await dal.TeachersOfCourses.GetAllAsync())
            .Any(o => o.CodeOfTeacherTc == t.CodeOfTeacherTc && o.CodeOfCourseTc == t.CodeOfCourseTc && o.CodeTc != t.CodeTc);
        Require(!duplicate, "המורה כבר משויך/ת לקורס הזה");
    }
}

/// <summary>A lesson slot in the annual timetable, with conflict detection.</summary>
public class BLAnnualHoursSystemService(IDal dal) : BLCrudService<BLAnnualHoursSystem, AnnualHoursSystem>(dal.AnnualHoursSystem, "שיעור")
{
    protected override void SetKey(BLAnnualHoursSystem item, int id) => item.AnnualHoursSystemCode = id;

    protected override void Normalize(BLAnnualHoursSystem item)
    {
        if (item.Date is { } date) item.DayInWeek = HebrewDays[(int)date.DayOfWeek];
        item.Status = string.IsNullOrWhiteSpace(item.Status) ? "מתוכנן" : item.Status.Trim();
    }

    protected override async Task ValidateAsync(BLAnnualHoursSystem l, bool isNew)
    {
        Require(l.Date != null && l.Hour != null, "יש לבחור תאריך ושעה לשיעור");
        Require(l.Date!.Value.DayOfWeek != DayOfWeek.Saturday, "לא ניתן לקבוע שיעור בשבת");

        var teacher = await dal.Teachers.GetByIdAsync(l.TeacherCode) ?? throw new BusinessRuleException("המורה שנבחר/ה אינו/ה קיים/ת");
        Require(teacher.ActOrNot?.Trim() != "false", "המורה אינו/ה פעיל/ה כרגע");
        Require(await dal.Students.GetByIdAsync(l.StudentCode) != null, "התלמיד שנבחר אינו קיים");

        var sameSlot = (await dal.AnnualHoursSystem.GetAllAsync())
            .Where(o => o.AnnualHoursSystemCode != l.AnnualHoursSystemCode && o.Date == l.Date && o.Hour == l.Hour && o.Status?.Trim() != "בוטל")
            .ToList();
        Require(sameSlot.All(o => o.TeacherCode != l.TeacherCode), "למורה כבר יש שיעור בשעה הזו");
        Require(sameSlot.All(o => o.StudentCode != l.StudentCode), "לתלמיד כבר יש שיעור בשעה הזו");

        var absent = (await dal.TeacherAbsences.GetAllAsync())
            .Any(a => a.CodeOfTeacher == l.TeacherCode && a.FromDate <= l.Date && (a.ToDate ?? a.FromDate) >= l.Date);
        Require(!absent, "המורה נעדר/ת בתאריך הזה");
    }
}

public class BLStudentIsAbsentService(IDal dal) : BLCrudService<BLStudentIsAbsent, StudentIsAbsent>(dal.StudentAbsences, "היעדרות תלמיד")
{
    protected override void SetKey(BLStudentIsAbsent item, int id) => item.StudentIsAbsentCode = id;

    protected override async Task ValidateAsync(BLStudentIsAbsent a, bool isNew)
    {
        Require(a.FromDate != null, "יש לבחור תאריך התחלה");
        Require(a.ToDate is null || a.ToDate >= a.FromDate, "תאריך הסיום חייב להיות אחרי תאריך ההתחלה");
        Require(await dal.Students.GetByIdAsync(a.StudentCode) != null, "התלמיד שנבחר אינו קיים");
    }
}

public class BLTeacherIsAbsentService(IDal dal) : BLCrudService<BLTeacherIsAbsent, TeacherIsAbsent>(dal.TeacherAbsences, "היעדרות מורה")
{
    protected override void SetKey(BLTeacherIsAbsent item, int id) => item.TeacherIsAbsentCode = id;

    protected override async Task ValidateAsync(BLTeacherIsAbsent a, bool isNew)
    {
        Require(a.FromDate != null, "יש לבחור תאריך התחלה");
        Require(a.ToDate is null || a.ToDate >= a.FromDate, "תאריך הסיום חייב להיות אחרי תאריך ההתחלה");
        Require(await dal.Teachers.GetByIdAsync(a.CodeOfTeacher) != null, "המורה שנבחר/ה אינו/ה קיים/ת");
    }
}

/// <summary>Waiting list, including promotion of a waiting student into the course.</summary>
public class BLStudentWaitingService(IDal dal) : BLCrudService<BLStudentWaiting, StudentWaiting>(dal.StudentWaitings, "רשומת המתנה")
{
    protected override void SetKey(BLStudentWaiting item, int id) => item.StudentWaitingCode = id;

    protected override void Normalize(BLStudentWaiting item) => item.WaitingDate ??= DateOnly.FromDateTime(DateTime.Today);

    protected override async Task ValidateAsync(BLStudentWaiting w, bool isNew)
    {
        Require(await dal.Students.GetByIdAsync(w.StudentCode) != null, "התלמיד שנבחר אינו קיים");
        Require(w.CourseCode is null || await dal.Courses.GetByIdAsync(w.CourseCode.Value) != null, "הקורס שנבחר אינו קיים");
        var duplicate = (await dal.StudentWaitings.GetAllAsync())
            .Any(o => o.StudentCode == w.StudentCode && o.CourseCode == w.CourseCode && o.StudentWaitingCode != w.StudentWaitingCode);
        Require(!duplicate, "התלמיד כבר ממתין לקורס הזה");
    }

    /// <summary>Moves a waiting student into the course: enrolls, activates and removes from the list.</summary>
    public async Task<BLStudentsOfCourse> PromoteAsync(int waitingId, int? teacherId, BLStudentsOfCourseService enrollments, BLStudentService students)
    {
        var waiting = await GetByIdAsync(waitingId);
        Require(waiting.CourseCode != null, "לא נבחר קורס עבור רשומת ההמתנה");

        var enrollment = await enrollments.CreateAsync(new BLStudentsOfCourse
        {
            CodeOfStudentSc = waiting.StudentCode,
            CodeOfCourseSc = waiting.CourseCode!.Value,
            CodeOfTeacherSc = teacherId
        });

        var student = await students.GetByIdAsync(waiting.StudentCode);
        if (student.ActOrWaitOrFinish != Active)
        {
            student.ActOrWaitOrFinish = Active;
            await students.UpdateAsync(student.CodeOfStudent, student);
        }
        await DeleteAsync(waitingId);
        return enrollment;
    }
}

public class BLEndStudentService(IDal dal) : BLCrudService<BLEndStudent, EndStudent>(dal.EndStudents, "סיום לימודים")
{
    protected override void SetKey(BLEndStudent item, int id) => item.CodeEndStudent = id;
}

public class BLEndTeacherService(IDal dal) : BLCrudService<BLEndTeacher, EndTeacher>(dal.EndTeachers, "סיום העסקה")
{
    protected override void SetKey(BLEndTeacher item, int id) => item.CodeEndTeacher = id;
}

public class BLReasonService(IDal dal) : BLCrudService<BLReason, Reason>(dal.Reasons, "סיבה")
{
    protected override void SetKey(BLReason item, int id) => item.CodeReason = id;
}
