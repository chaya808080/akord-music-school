using DAL.Api;
using DAL.Models;

namespace DAL.Services;

public class StudentsService(DbManager db) : CrudService<Student>(db), IStudents;
public class FamiliesService(DbManager db) : CrudService<Family>(db), IFamilies;
public class TeachersService(DbManager db) : CrudService<Teacher>(db), ITeachers;
public class CoursesService(DbManager db) : CrudService<Course>(db), ICourses;
public class StudentsOfCoursesService(DbManager db) : CrudService<StudentsOfCourse>(db), IStudentsOfCourses;
public class TeachersOfCoursesService(DbManager db) : CrudService<TeachersOfCourse>(db), ITeachersOfCourses;
public class AnnualHoursSystemService(DbManager db) : CrudService<AnnualHoursSystem>(db), IAnnualHoursSystem;
public class StudentIsAbsentService(DbManager db) : CrudService<StudentIsAbsent>(db), IStudentIsAbsent;
public class TeacherIsAbsentService(DbManager db) : CrudService<TeacherIsAbsent>(db), ITeacherIsAbsent;
public class StudentWaitingService(DbManager db) : CrudService<StudentWaiting>(db), IStudentWaiting;
public class EndStudentService(DbManager db) : CrudService<EndStudent>(db), IEndStudent;
public class EndTeacherService(DbManager db) : CrudService<EndTeacher>(db), IEndTeacher;
public class ReasonsService(DbManager db) : CrudService<Reason>(db), IReasons;
