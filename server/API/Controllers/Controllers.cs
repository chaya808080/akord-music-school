using BL;
using BL.Models;
using BL.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Route("api/students")] public class StudentsController(BLManager bl) : CrudController<BLStudent>(bl.Students);
[Route("api/families")] public class FamiliesController(BLManager bl) : CrudController<BLFamily>(bl.Families);
[Route("api/teachers")] public class TeachersController(BLManager bl) : CrudController<BLTeacher>(bl.Teachers);
[Route("api/courses")] public class CoursesController(BLManager bl) : CrudController<BLCourse>(bl.Courses);
[Route("api/enrollments")] public class EnrollmentsController(BLManager bl) : CrudController<BLStudentsOfCourse>(bl.Enrollments);
[Route("api/teacher-courses")] public class TeacherCoursesController(BLManager bl) : CrudController<BLTeachersOfCourse>(bl.TeacherCourses);
[Route("api/lessons")] public class LessonsController(BLManager bl) : CrudController<BLAnnualHoursSystem>(bl.Lessons);
[Route("api/student-absences")] public class StudentAbsencesController(BLManager bl) : CrudController<BLStudentIsAbsent>(bl.StudentAbsences);
[Route("api/teacher-absences")] public class TeacherAbsencesController(BLManager bl) : CrudController<BLTeacherIsAbsent>(bl.TeacherAbsences);
[Route("api/student-endings")] public class StudentEndingsController(BLManager bl) : CrudController<BLEndStudent>(bl.StudentEndings);
[Route("api/teacher-endings")] public class TeacherEndingsController(BLManager bl) : CrudController<BLEndTeacher>(bl.TeacherEndings);
[Route("api/reasons")] public class ReasonsController(BLManager bl) : CrudController<BLReason>(bl.Reasons);

[Route("api/waiting-list")]
public class WaitingListController(BLManager bl) : CrudController<BLStudentWaiting>(bl.WaitingList)
{
    /// <summary>Enrolls the waiting student in the requested course and removes the waiting entry.</summary>
    [HttpPost("{id:int}/promote")]
    public Task<BLStudentsOfCourse> Promote(int id, [FromQuery] int? teacherId) =>
        bl.WaitingList.PromoteAsync(id, teacherId, bl.Enrollments, bl.Students);
}

[ApiController]
[Route("api/stats")]
public class StatsController(BLManager bl) : ControllerBase
{
    [HttpGet("dashboard")]
    public Task<DashboardStats> Dashboard() => bl.Stats.GetDashboardAsync();
}
