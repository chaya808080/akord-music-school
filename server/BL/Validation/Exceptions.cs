namespace BL.Validation;

/// <summary>A business rule was violated - surfaced to the client as HTTP 400 with the Hebrew message.</summary>
public class BusinessRuleException(string message) : Exception(message);

/// <summary>The requested entity does not exist - surfaced as HTTP 404.</summary>
public class NotFoundException(string entity, int id) : Exception($"{entity} {id} לא נמצא");
