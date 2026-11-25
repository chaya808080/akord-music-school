using DAL.Api;
using DAL.Models;
using DAL.Services;

namespace DAL;

/// <summary>Builds every repository over the same DbContext, so one request = one unit of work.</summary>
public class DalManager(DbManager db) : IDal
{
    public IStudents Students { get; } = new StudentsService(db);
    public IFamilies Families { get; } = new FamiliesService(db);
    public ITeachers Teachers { get; } = new TeachersService(db);
    public ICourses Courses { get; } = new CoursesService(db);
    public IStudentsOfCourses StudentsOfCourses { get; } = new StudentsOfCoursesService(db);
    public ITeachersOfCourses TeachersOfCourses { get; } = new TeachersOfCoursesService(db);
    public IAnnualHoursSystem AnnualHoursSystem { get; } = new AnnualHoursSystemService(db);
    public IStudentIsAbsent StudentAbsences { get; } = new StudentIsAbsentService(db);
    public ITeacherIsAbsent TeacherAbsences { get; } = new TeacherIsAbsentService(db);
    public IStudentWaiting StudentWaitings { get; } = new StudentWaitingService(db);
    public IEndStudent EndStudents { get; } = new EndStudentService(db);
    public IEndTeacher EndTeachers { get; } = new EndTeacherService(db);
    public IReasons Reasons { get; } = new ReasonsService(db);
}
