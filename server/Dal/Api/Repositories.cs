using DAL.Models;

namespace DAL.Api;

public interface IStudents : ICrud<Student> { }
public interface IFamilies : ICrud<Family> { }
public interface ITeachers : ICrud<Teacher> { }
public interface ICourses : ICrud<Course> { }
public interface IStudentsOfCourses : ICrud<StudentsOfCourse> { }
public interface ITeachersOfCourses : ICrud<TeachersOfCourse> { }
public interface IAnnualHoursSystem : ICrud<AnnualHoursSystem> { }
public interface IStudentIsAbsent : ICrud<StudentIsAbsent> { }
public interface ITeacherIsAbsent : ICrud<TeacherIsAbsent> { }
public interface IStudentWaiting : ICrud<StudentWaiting> { }
public interface IEndStudent : ICrud<EndStudent> { }
public interface IEndTeacher : ICrud<EndTeacher> { }
public interface IReasons : ICrud<Reason> { }
