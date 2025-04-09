# OpenRouter Tool Registration System

This module provides an easy-to-use system for registering C# methods as tools for OpenRouter's function calling API. The system allows you to:

1. Mark C# methods as tools using simple attributes
2. Register methods directly with minimal boilerplate code
3. Automatically generate JSON schema for tool parameters
4. Execute tools with automatic argument deserialization
5. Create a loop for handling tool calls in conversations

## How It Works

The tool registration system consists of several components:

- **Attributes**: Mark methods and parameters as tools with metadata
- **Schema Generator**: Converts C# method information to JSON schema
- **Tool Registration Extensions**: Register methods directly as tools
- **OpenRouterClient**: Enhanced with tool registration and execution capabilities

## Usage Examples

### 1. Define Tools with Attributes

```csharp
public class MyTools
{
    [ToolMethod(Description = "Gets the current weather for a location")]
    public string GetWeather(
        [ToolParameter(Description = "The city and state, e.g. San Francisco, CA", Required = true)]
        string location)
    {
        // Implementation here
        return $"Weather for {location}: Sunny, 72°F";
    }
}
```

### 2. Register Tools with the Client

```csharp
// Create the client
var client = new OpenRouterClient(apiKey);

// Create tools instance
var myTools = new MyTools();

// Register tool by method reference
client.RegisterTool(myTools.GetWeather);
```

### 3. Use Tools in Conversations

```csharp
// Create a request with messages
var request = new ChatCompletionRequest
{
    Model = "openai/gpt-4o",
    Messages = new[]
    {
        Message.FromSystem("You have access to tools. Use them when helpful."),
        Message.FromUser("What's the weather like in San Francisco?")
    }
};

// Execute the request with automatic tool handling
var response = await client.SendMessageWithToolLoopAsync(request);

// Return the response to the user
Console.WriteLine(response.Choices[0].Message.Content);
```

## Tool Attributes

### ToolMethodAttribute

```csharp
[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
public class ToolMethodAttribute : Attribute
{
    public string Description { get; }
    public string Name { get; }
    
    public ToolMethodAttribute(string description, string name = null)
    {
        Description = description;
        Name = name;
    }
}
```

### ToolParameterAttribute

```csharp
[AttributeUsage(AttributeTargets.Parameter, AllowMultiple = false)]
public class ToolParameterAttribute : Attribute
{
    public string Description { get; }
    public bool Required { get; set; } = true;
    
    public ToolParameterAttribute(string description)
    {
        Description = description;
    }
}
```

## Sample Tools

The package includes a set of sample tools in `SampleTools.cs` that demonstrate various tool implementations:

- `GetWeather`: Mock weather data
- `Calculate`: Simple calculator
- `SearchBooks`: Book search functionality
- `GetTime`: Time retrieval by timezone
- `TranslateText`: Text translation (async example)

## API Controller

An example controller is included in `OpenRouterToolsController.cs` that demonstrates:

1. Setting up the client with tools
2. Registering tools dynamically based on user request
3. Handling chat conversations with tool calls
4. Listing available tools and their schemas

## Implementation Details

The implementation uses reflection to extract method information and generate JSON schemas that conform to the OpenRouter API specifications. When a tool is called, the system deserializes the arguments and invokes the corresponding method, handling both synchronous and asynchronous methods.

## Error Handling

The system includes robust error handling for:

- Invalid method signatures
- Missing required parameters
- Type conversion errors
- Execution exceptions

All errors are properly wrapped and reported to make debugging easier.

## Extending the System

To extend the system with your own tools:

1. Create a class with your tool methods
2. Add the appropriate attributes to methods and parameters
3. Register your methods with the client
4. Use the client to handle conversations with tool calls

You can also customize the schema generation and parameter handling for special cases by extending the `SchemaGenerator` class.

## Requirements

- .NET 6.0 or later
- System.Text.Json for JSON serialization
- System.Reflection for method introspection

## License

[Add your license information here] 