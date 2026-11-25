using API.Infrastructure;
using BL.Models;
using BL.Services;
using BL.Validation;
using DAL.Models;

namespace Akord.Tests;

public class RulesTests
{
    [Theory]
    [InlineData("123456782", true)]
    [InlineData("000000018", true)]
    [InlineData("123456789", false)]
    [InlineData("12345678a", false)]
    [InlineData("", false)]
    public void Israeli_id_check_digit(string id, bool valid) => Assert.Equal(valid, Rules.IsValidIsraeliId(id));

    [Fact]
    public void Seeder_generates_valid_ids()
    {
        for (var i = 0; i < 200; i++) Assert.True(Rules.IsValidIsraeliId(DemoSeeder.IsraeliId(10000000 + i * 37)));
    }

    [Theory]
    [InlineData("בנים", "בן", true)]
    [InlineData("בנים", "בת", false)]
    [InlineData("בנות", "בת", true)]
    [InlineData("מעורב", "בן", true)]
    public void Course_gender_fits(string course, string student, bool fits) => Assert.Equal(fits, Rules.GenderFits(course, student));

    [Theory]
    [InlineData(typeof(Student), typeof(BLStudent))]
    [InlineData(typeof(Family), typeof(BLFamily))]
    [InlineData(typeof(Teacher), typeof(BLTeacher))]
    [InlineData(typeof(Course), typeof(BLCourse))]
    [InlineData(typeof(StudentsOfCourse), typeof(BLStudentsOfCourse))]
    [InlineData(typeof(TeachersOfCourse), typeof(BLTeachersOfCourse))]
    [InlineData(typeof(AnnualHoursSystem), typeof(BLAnnualHoursSystem))]
    [InlineData(typeof(StudentIsAbsent), typeof(BLStudentIsAbsent))]
    [InlineData(typeof(TeacherIsAbsent), typeof(BLTeacherIsAbsent))]
    [InlineData(typeof(StudentWaiting), typeof(BLStudentWaiting))]
    [InlineData(typeof(EndStudent), typeof(BLEndStudent))]
    [InlineData(typeof(EndTeacher), typeof(BLEndTeacher))]
    [InlineData(typeof(Reason), typeof(BLReason))]
    public void Every_column_is_mapped_both_ways(Type dal, Type bl)
    {
        Assert.Empty(Mapper.Unmapped(dal, bl));
        Assert.Empty(Mapper.Unmapped(bl, dal));
    }
}

public class BusinessServiceTests
{
    [Fact]
    public async Task Enrollment_rejects_student_outside_course_age_range()
    {
        using var t = await TestDb.CreateSeededAsync();
        var course = await t.BL.Courses.CreateAsync(new BLCourse { NameOfCourse = "גן מוזיקלי", SexOfCourse = "מעורב", PriceOfCourse = 150, FromAge = 3, ToAge = 5 });
        var student = (await t.BL.Students.GetAllAsync()).First();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            t.BL.Enrollments.CreateAsync(new BLStudentsOfCourse { CodeOfStudentSc = student.CodeOfStudent, CodeOfCourseSc = course.CodeOfCourse }));
        Assert.Contains("גיל", ex.Message);
    }

    [Fact]
    public async Task Enrollment_rejects_gender_mismatch_and_duplicates()
    {
        using var t = await TestDb.CreateSeededAsync();
        var boy = (await t.BL.Students.GetAllAsync()).First(s => s.sexOfStudent == "בן");
        var girlsCourse = (await t.BL.Courses.GetAllAsync()).First(c => c.SexOfCourse == "בנות");
        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            t.BL.Enrollments.CreateAsync(new BLStudentsOfCourse { CodeOfStudentSc = boy.CodeOfStudent, CodeOfCourseSc = girlsCourse.CodeOfCourse }));

        var existing = (await t.BL.Enrollments.GetAllAsync()).First();
        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            t.BL.Enrollments.CreateAsync(new BLStudentsOfCourse { CodeOfStudentSc = existing.CodeOfStudentSc, CodeOfCourseSc = existing.CodeOfCourseSc }));
    }

    [Fact]
    public async Task Lesson_detects_teacher_double_booking_and_fills_day_name()
    {
        using var t = await TestDb.CreateSeededAsync();
        var lesson = (await t.BL.Lessons.GetAllAsync()).First();
        var other = (await t.BL.Students.GetAllAsync()).First(s => s.CodeOfStudent != lesson.StudentCode);

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() => t.BL.Lessons.CreateAsync(new BLAnnualHoursSystem
        {
            TeacherCode = lesson.TeacherCode, StudentCode = other.CodeOfStudent, Date = lesson.Date, Hour = lesson.Hour
        }));
        Assert.Contains("למורה כבר יש שיעור", ex.Message);

        var sunday = NextDay(DayOfWeek.Sunday);
        var created = await t.BL.Lessons.CreateAsync(new BLAnnualHoursSystem
        {
            TeacherCode = lesson.TeacherCode, StudentCode = other.CodeOfStudent, Date = sunday, Hour = new TimeOnly(9, 0)
        });
        Assert.Equal("ראשון", created.DayInWeek);
        Assert.Equal("מתוכנן", created.Status);
    }

    [Fact]
    public async Task Lesson_on_shabbat_is_rejected()
    {
        using var t = await TestDb.CreateSeededAsync();
        var lesson = (await t.BL.Lessons.GetAllAsync()).First();
        await Assert.ThrowsAsync<BusinessRuleException>(() => t.BL.Lessons.CreateAsync(new BLAnnualHoursSystem
        {
            TeacherCode = lesson.TeacherCode, StudentCode = lesson.StudentCode, Date = NextDay(DayOfWeek.Saturday), Hour = new TimeOnly(10, 0)
        }));
    }

    [Fact]
    public async Task Promoting_from_waiting_list_enrolls_and_activates_the_student()
    {
        using var t = await TestDb.CreateSeededAsync();
        var waiting = (await t.BL.WaitingList.GetAllAsync()).First();

        var enrollment = await t.BL.WaitingList.PromoteAsync(waiting.StudentWaitingCode, null, t.BL.Enrollments, t.BL.Students);

        Assert.Equal(waiting.StudentCode, enrollment.CodeOfStudentSc);
        Assert.Equal(Rules.Active, (await t.BL.Students.GetByIdAsync(waiting.StudentCode)).ActOrWaitOrFinish);
        Assert.DoesNotContain(await t.BL.WaitingList.GetAllAsync(), w => w.StudentWaitingCode == waiting.StudentWaitingCode);
    }

    [Fact]
    public async Task Update_and_referential_delete_rules()
    {
        using var t = await TestDb.CreateSeededAsync();
        var course = (await t.BL.Courses.GetAllAsync()).First();
        course.PriceOfCourse = 999;
        await t.BL.Courses.UpdateAsync(course.CodeOfCourse, course);
        Assert.Equal(999, (await t.BL.Courses.GetByIdAsync(course.CodeOfCourse)).PriceOfCourse);

        var family = (await t.BL.Families.GetAllAsync()).First();
        await Assert.ThrowsAsync<BusinessRuleException>(() => t.BL.Families.DeleteAsync(family.CodeFamily));
        await Assert.ThrowsAsync<NotFoundException>(() => t.BL.Courses.GetByIdAsync(424242));
    }

    [Fact]
    public async Task Invalid_student_is_rejected_with_hebrew_message()
    {
        using var t = await TestDb.CreateSeededAsync();
        var family = (await t.BL.Families.GetAllAsync()).First();
        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() => t.BL.Students.CreateAsync(new BLStudent
        {
            FirstName = "בדיקה", IdOfStudents = 123456789, CodeFamily = family.CodeFamily
        }));
        Assert.Equal("מספר תעודת הזהות אינו תקין", ex.Message);
    }

    [Fact]
    public async Task Dashboard_stats_are_consistent()
    {
        using var t = await TestDb.CreateSeededAsync();
        var stats = await t.BL.Stats.GetDashboardAsync();
        var students = await t.BL.Students.GetAllAsync();

        Assert.Equal(students.Count, stats.ActiveStudents + stats.WaitingStudents + stats.FinishedStudents);
        Assert.Equal(stats.ActiveStudents, stats.EnrollmentsByCourse.Sum(c => c.Count));
        Assert.True(stats.MonthlyRevenue > 0);
        Assert.Equal(12, stats.NewStudentsByMonth.Count);
    }

    private static DateOnly NextDay(DayOfWeek day)
    {
        var d = DateOnly.FromDateTime(DateTime.Today).AddDays(30);
        while (d.DayOfWeek != day) d = d.AddDays(1);
        return d;
    }
}
