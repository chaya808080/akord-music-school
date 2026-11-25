namespace DAL.Api;

/// <summary>Single entry point to all repositories (one instance per request).</summary>
public interface IDal
{
    IStudents Students { get; }
    IFamilies Families { get; }
    ITeachers Teachers { get; }
    ICourses Courses { get; }
    IStudentsOfCourses StudentsOfCourses { get; }
    ITeachersOfCourses TeachersOfCourses { get; }
    IAnnualHoursSystem AnnualHoursSystem { get; }
    IStudentIsAbsent StudentAbsences { get; }
    ITeacherIsAbsent TeacherAbsences { get; }
    IStudentWaiting StudentWaitings { get; }
    IEndStudent EndStudents { get; }
    IEndTeacher EndTeachers { get; }
    IReasons Reasons { get; }
}
