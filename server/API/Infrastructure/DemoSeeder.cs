using DAL.Models;

namespace API.Infrastructure;

/// <summary>Fills a freshly created database with invented demo data (development only).</summary>
public static class DemoSeeder
{
    public static async Task SeedAsync(DbManager db)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);

        var reasons = new[] { "מעבר דירה", "עומס לימודים", "סיום מסלול", "מחלה", "חופשה" }
            .Select(d => new Reason { DiscribeReason = d }).ToList();
        db.Reasons.AddRange(reasons);

        var families = new[]
        {
            ("כהן", "רמת גן"), ("לוי", "בני ברק"), ("מזרחי", "פתח תקווה"), ("פרץ", "גבעתיים"),
            ("ביטון", "תל אביב"), ("אברהם", "חולון"), ("פרידמן", "רמת גן"), ("שפירא", "בני ברק"),
        }.Select((f, i) => new Family
        {
            LastName = f.Item1, Address = f.Item2, Phone = $"05{i}0000{i:D3}", Mail = $"family{i + 1}@demo.co.il",
            Paiy = i % 3 == 0 ? "הוראת קבע" : i % 3 == 1 ? "אשראי" : "העברה בנקאית"
        }).ToList();
        db.Families.AddRange(families);
        await db.SaveChangesAsync();

        var courses = new[]
        {
            ("פסנתר", "מעורב", 320.0, 6, 18), ("כינור", "בנות", 300.0, 7, 16), ("גיטרה", "מעורב", 280.0, 9, 18),
            ("חליל צד", "בנות", 260.0, 8, 15), ("תופים", "בנים", 290.0, 10, 18), ("פיתוח קול", "בנות", 310.0, 10, 18),
        }.Select(c => new Course
        {
            NameOfCourse = c.Item1, SexOfCourse = c.Item2, PriceOfCourse = c.Item3, FromAge = c.Item4, ToAge = c.Item5,
            DuretionTimeOfCourse = 45, DescriptionOfCourse = $"שיעור פרטני ב{c.Item1}, כולל תיאוריה והופעה בסוף שנה"
        }).ToList();
        db.Courses.AddRange(courses);

        var teachers = new[]
        {
            ("מיכל", "אורן", "בת"), ("דניאל", "רוזן", "בן"), ("נועה", "גל", "בת"), ("יעקב", "שטרן", "בן"), ("רות", "נחום", "בת"),
        }.Select((t, i) => new Teacher
        {
            FirstNameOfTeacher = t.Item1, LastNameOfTeacher = t.Item2, SexOfTeacher = t.Item3, IdOfTeacher = IsraeliId(30000000 + i * 7919),
            PhoneOfTeacher = $"05{i + 2}1111{i:D3}", Mail = $"t{i + 1}@akord.co.il", ActOrNot = "true"
        }).ToList();
        db.Teachers.AddRange(teachers);
        await db.SaveChangesAsync();

        // teacher i teaches course i, the first teacher also teaches guitar
        var teacherCourses = courses.Select((c, i) => new TeachersOfCourse { CodeOfCourseTc = c.CodeOfCourse, CodeOfTeacherTc = teachers[i % teachers.Count].CodeOfTeacher }).ToList();
        teacherCourses.Add(new TeachersOfCourse { CodeOfCourseTc = courses[2].CodeOfCourse, CodeOfTeacherTc = teachers[0].CodeOfTeacher });
        db.TeachersOfCourses.AddRange(teacherCourses);

        string[] boys = ["איתי", "יונתן", "אורי", "דוד", "משה", "אליה", "נתנאל", "יוסף"];
        string[] girls = ["נועה", "שירה", "תמר", "אביגיל", "מיכל", "הדס", "רחל", "יעל", "אסתר", "חנה"];
        var students = new List<Student>();
        for (var i = 0; i < 18; i++)
        {
            var girl = i % 3 != 0;
            students.Add(new Student
            {
                FirstName = girl ? girls[i % girls.Length] : boys[i % boys.Length],
                sexOfStudent = girl ? "בת" : "בן",
                IdOfStudents = int.Parse(IsraeliId(20000000 + i * 104729)),
                CodeFamily = families[i % families.Count].CodeFamily,
                BirsDate = today.AddYears(-(9 + i % 7)).AddDays(-i * 11),
                BeginDate = today.AddMonths(-(i % 12)).AddDays(-i),
                CountLessonAct = 4 + i % 20,
                FixLesson = i % 3,
                ActOrWaitOrFinish = i % 9 == 4 ? "מחכה" : i % 9 == 8 ? "גמר" : "פעיל",
            });
        }
        db.Students.AddRange(students);
        await db.SaveChangesAsync();

        var lessonCode = 0;
        foreach (var s in students.Where(s => s.ActOrWaitOrFinish == "פעיל"))
        {
            var age = today.Year - s.BirsDate!.Value.Year;
            var course = courses.First(c => (c.SexOfCourse == "מעורב" || (c.SexOfCourse == "בנות") == (s.sexOfStudent == "בת")) && age >= c.FromAge && age <= c.ToAge);
            var teacher = teacherCourses.First(t => t.CodeOfCourseTc == course.CodeOfCourse).CodeOfTeacherTc;
            db.StudentsOfCourses.Add(new StudentsOfCourse { CodeOfStudentSc = s.CodeOfStudent, CodeOfCourseSc = course.CodeOfCourse, CodeOfTeacherSc = teacher });

            var day = today.AddDays(-(int)today.DayOfWeek + s.CodeOfStudent % 5);
            db.AnnualHoursSystems.Add(new AnnualHoursSystem
            {
                AnnualHoursSystemCode = ++lessonCode, StudentCode = s.CodeOfStudent, TeacherCode = teacher, Date = day, Hour = new TimeOnly(14 + s.CodeOfStudent % 5, 0),
                DayInWeek = new[] { "ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת" }[(int)day.DayOfWeek], Status = "מתוכנן"
            });
        }

        var waiting = students.Where(s => s.ActOrWaitOrFinish == "מחכה").ToList();
        for (var i = 0; i < waiting.Count; i++)
            db.StudentWaitings.Add(new StudentWaiting { StudentWaitingCode = i + 1, StudentCode = waiting[i].CodeOfStudent, CourseCode = courses[0].CodeOfCourse, WaitingDate = today.AddDays(-7 * (i + 1)), WaitingReason = "אין מקום פנוי" });

        db.TeacherIsAbsents.Add(new TeacherIsAbsent { TeacherIsAbsentCode = 1, CodeOfTeacher = teachers[3].CodeOfTeacher, FromDate = today.AddDays(10), ToDate = today.AddDays(12), ReasonAbsentT = "השתלמות" });
        db.StudentIsAbsents.Add(new StudentIsAbsent { StudentIsAbsentCode = 1, StudentCode = students[1].CodeOfStudent, FromDate = today.AddDays(-2), ToDate = today, ReasonAbsentS = "מחלה" });

        await db.SaveChangesAsync();
    }

    /// <summary>Appends a valid check digit to an 8-digit base number.</summary>
    public static string IsraeliId(int base8)
    {
        var digits = base8.ToString("D8");
        var sum = 0;
        for (var i = 0; i < 8; i++)
        {
            var d = (digits[i] - '0') * (i % 2 + 1);
            sum += d > 9 ? d - 9 : d;
        }
        return digits + (10 - sum % 10) % 10;
    }
}
