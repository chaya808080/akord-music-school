using System;
using System.Collections.Generic;

namespace BL.Models;

public class BLTeacherIsAbsent
{
    public int TeacherIsAbsentCode { get; set; }

    public int CodeOfTeacher { get; set; }

    public DateOnly? FromDate { get; set; }

    public DateOnly? ToDate { get; set; }

    public int? CodeReasonAbsentT { get; set; }

    public string? ReasonAbsentT { get; set; }

    public virtual BLTeacher CodeOfTeacherNavigation { get; set; } = null!;

    public virtual BLReason? CodeReasonAbsentTNavigation { get; set; }
}
