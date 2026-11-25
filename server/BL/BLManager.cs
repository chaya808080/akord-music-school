using BL.Services;
using DAL.Api;

namespace BL;

/// <summary>Facade over all business services. Registered per request, on top of the request's IDal.</summary>
public class BLManager(IDal dal)
{
    public BLStudentService Students { get; } = new(dal);
    public BLFamilyService Families { get; } = new(dal);
    public BLTeacherService Teachers { get; } = new(dal);
    public BLCourseService Courses { get; } = new(dal);
    public BLStudentsOfCourseService Enrollments { get; } = new(dal);
    public BLTeachersOfCourseService TeacherCourses { get; } = new(dal);
    public BLAnnualHoursSystemService Lessons { get; } = new(dal);
    public BLStudentIsAbsentService StudentAbsences { get; } = new(dal);
    public BLTeacherIsAbsentService TeacherAbsences { get; } = new(dal);
    public BLStudentWaitingService WaitingList { get; } = new(dal);
    public BLEndStudentService StudentEndings { get; } = new(dal);
    public BLEndTeacherService TeacherEndings { get; } = new(dal);
    public BLReasonService Reasons { get; } = new(dal);
    public BLStatsService Stats { get; } = new(dal);
}
