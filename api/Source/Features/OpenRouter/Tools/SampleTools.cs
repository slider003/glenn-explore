using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Api.Features.OpenRouter.Tools
{
    /// <summary>
    /// Sample tools for demonstration and testing
    /// </summary>
    public class SampleTools
    {

        /// <summary>
        /// Suggest a location for the player to teleport to (player must click the teleport button to actually teleport)
        /// </summary>
        [ToolMethod("Suggest a location for the player to teleport to")]
        public async Task<string> SuggestLocation(
            [ToolParameter("Latitude coordinate (between -90 and 90)")] double latitude,
            [ToolParameter("Longitude coordinate (between -180 and 180)")] double longitude,
            [ToolParameter("Name of the location (e.g., 'Eiffel Tower', 'Central Park')")] string locationName,
            [ToolParameter("Brief description of what can be found at this location (optional)")] string description = "")
        {
            // Validate coordinates
            latitude = Math.Max(-90, Math.Min(90, latitude));
            longitude = Math.Max(-180, Math.Min(180, longitude));

            // Add a short delay to simulate processing
            await Task.Delay(300);

            // Create response with the teleport details
            var response = new Dictionary<string, object>
            {
                ["success"] = true,
                ["action"] = "teleport",
                ["location"] = new Dictionary<string, object>
                {
                    ["name"] = locationName,
                    ["description"] = string.IsNullOrEmpty(description) ? $"Interesting location at {locationName}" : description,
                    ["coordinates"] = new Dictionary<string, double>
                    {
                        ["lat"] = latitude,
                        ["lng"] = longitude
                    },
                    ["timestamp"] = DateTime.UtcNow
                }
            };

            return JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                WriteIndented = true
            });
        }
        /// <summary>
        /// Read code and return a React TSX component
        /// </summary>
        [ToolMethod("Read code and return a React TSX component")]
        public async Task<string> ReadCode([ToolParameter("The name of the file to read")] string fileName)
        {
            // Add delay to simulate file reading
            await Task.Delay(500);

            // Return a sample React component
            return @"import React from 'react';
import { useState, useEffect } from 'react';

interface Props {
    title: string;
    onAction: () => void;
}

export const SampleComponent: React.FC<Props> = ({ title, onAction }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        console.log('Component mounted');
        return () => console.log('Component unmounted');
    }, []);

    return (
        <div className='sample-component'>
            <h1>{title}</h1>
            <p>Count: {count}</p>
            <button onClick={() => setCount(prev => prev + 1)}>
                Increment
            </button>
            <button onClick={onAction}>
                Trigger Action
            </button>
        </div>
    );
};";
        }

        /// <summary>
        /// Write code by replacing text in a file
        /// </summary>
        [ToolMethod("Write code by replacing text in a file")]
        public async Task<string> WriteCode(
            [ToolParameter("Text to search for")] string searchFor,
            [ToolParameter("Text to replace with")] string replaceWith)
        {
            // Add delay to simulate file writing
            await Task.Delay(500);

            // Return a mock response
            var response = new Dictionary<string, object>
            {
                ["success"] = true,
                ["operation"] = "replace",
                ["searchedFor"] = searchFor,
                ["replacedWith"] = replaceWith,
                ["timestamp"] = DateTime.UtcNow,
                ["changes"] = new Dictionary<string, object>
                {
                    ["filesModified"] = 1,
                    ["occurrencesReplaced"] = 3,
                    ["linesAffected"] = 5
                }
            };

            return JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                WriteIndented = true
            });
        }
    }
}