using BL.Validation;
using DAL.Api;

namespace BL.Services;

public record CountByName(string Name, int Count);
public record MonthValue(string Month, int Value);

public record DashboardStats(
    int ActiveStudents,
    int WaitingStudents,
    int FinishedStudents,
    int ActiveTeachers,
    int Courses,
    int Families,
    double MonthlyRevenue,
    int LessonsThisWeek,
    List<CountByName> EnrollmentsByCourse,
    List<MonthValue> NewStudentsByMonth);

/// <summary>Aggregations for the management dashboard, computed in one pass over the data.</summary>
public class BLStatsService(IDal dal)
{
    public async Task<DashboardStats> GetDashboardAsync(DateOnly? today = null)
    {
        var now = today ?? DateOnly.FromDateTime(DateTime.Today);
        var students = await dal.Students.GetAllAsync();
        var courses = await dal.Courses.GetAllAsync();
        var enrollments = await dal.StudentsOfCourses.GetAllAsync();
        var teachers = await dal.Teachers.GetAllAsync();
        var lessons = await dal.AnnualHoursSystem.GetAllAsync();
        var families = await dal.Families.GetAllAsync();

        string Status(string? s) => s?.Trim() ?? "";
        var activeIds = students.Where(s => Status(s.ActOrWaitOrFinish) == Rules.Active).Select(s => s.CodeOfStudent).ToHashSet();
        var priceOf = courses.ToDictionary(c => c.CodeOfCourse, c => c.PriceOfCourse);

        var weekStart = now.AddDays(-(int)now.DayOfWeek);
        var firstMonth = new DateOnly(now.Year, now.Month, 1).AddMonths(-11);

        return new DashboardStats(
            ActiveStudents: activeIds.Count,
            WaitingStudents: students.Count(s => Status(s.ActOrWaitOrFinish) == Rules.Waiting),
            FinishedStudents: students.Count(s => Status(s.ActOrWaitOrFinish) == Rules.Finished),
            ActiveTeachers: teachers.Count(t => t.ActOrNot?.Trim() != "false"),
            Courses: courses.Count,
            Families: families.Count,
            MonthlyRevenue: enrollments.Where(e => activeIds.Contains(e.CodeOfStudentSc))
                                       .Sum(e => priceOf.GetValueOrDefault(e.CodeOfCourseSc)),
            LessonsThisWeek: lessons.Count(l => l.Date >= weekStart && l.Date < weekStart.AddDays(7)),
            EnrollmentsByCourse: courses
                .Select(c => new CountByName(c.NameOfCourse.Trim(), enrollments.Count(e => e.CodeOfCourseSc == c.CodeOfCourse)))
                .OrderByDescending(c => c.Count).ToList(),
            NewStudentsByMonth: Enumerable.Range(0, 12).Select(i => firstMonth.AddMonths(i))
                .Select(m => new MonthValue($"{m:yyyy-MM}", students.Count(s => s.BeginDate is { } b && b.Year == m.Year && b.Month == m.Month)))
                .ToList());
    }
}
