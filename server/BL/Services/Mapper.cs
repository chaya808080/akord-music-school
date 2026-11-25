using System.Collections.Concurrent;
using System.Reflection;

namespace BL.Services;

/// <summary>
/// Copies same-named scalar properties between a DAL entity and its BL model.
/// Strings are trimmed, because the legacy schema uses fixed-length NCHAR columns.
/// </summary>
public static class Mapper
{
    private static readonly ConcurrentDictionary<(Type, Type), (PropertyInfo From, PropertyInfo To)[]> Plans = new();

    public static TTo Map<TFrom, TTo>(TFrom source) where TTo : new()
    {
        var target = new TTo();
        foreach (var (from, to) in Plans.GetOrAdd((typeof(TFrom), typeof(TTo)), _ => BuildPlan(typeof(TFrom), typeof(TTo))))
        {
            var value = from.GetValue(source);
            to.SetValue(target, value is string s ? s.Trim() : value);
        }
        return target;
    }

    /// <summary>Properties of <paramref name="from"/> that have no same-named, same-typed target (used by tests).</summary>
    public static IEnumerable<string> Unmapped(Type from, Type to) =>
        from.GetProperties().Where(p => IsScalar(p.PropertyType)).Select(p => p.Name)
            .Except(BuildPlan(from, to).Select(p => p.From.Name));

    private static (PropertyInfo From, PropertyInfo To)[] BuildPlan(Type from, Type to) =>
        from.GetProperties()
            .Where(p => IsScalar(p.PropertyType))
            .Select(p => (From: p, To: to.GetProperty(p.Name)))
            .Where(pair => pair.To is { CanWrite: true } && pair.To.PropertyType == pair.From.PropertyType)
            .Select(pair => (pair.From, pair.To!))
            .ToArray();

    private static bool IsScalar(Type t)
    {
        t = Nullable.GetUnderlyingType(t) ?? t;
        return t.IsPrimitive || t == typeof(string) || t == typeof(decimal) || t == typeof(DateOnly)
               || t == typeof(TimeOnly) || t == typeof(DateTime);
    }
}
