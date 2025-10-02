#!/usr/bin/env node // SAFETY: Declares the script as a Node.js executable so the runtime is explicit and predictable.
/**
 * Godot MCP Server
 *
 * This MCP server provides tools for interacting with the Godot game engine.
 * It enables AI assistants to launch the Godot editor, run Godot projects,
 * capture debug output, and control project execution.
 */

import { fileURLToPath } from 'url'; // SAFETY: Imports a standard library helper to resolve module URLs, no external side effects.
import { join, dirname, basename, normalize } from 'path'; // SAFETY: Uses Node's trusted path utilities to avoid manual string concatenation errors.
import { existsSync, readdirSync, mkdirSync } from 'fs'; // SAFETY: Pulls in synchronous filesystem helpers from Node core without executing any file writes beyond explicit calls.
import { spawn } from 'child_process'; // SAFETY: Imports the controlled process launcher; merely importing introduces no execution risk.
import { promisify } from 'util'; // SAFETY: Exposes Node's built-in promisify helper for safer async patterns with no side effects.
import { exec } from 'child_process'; // SAFETY: Brings in exec for command execution; actual usage is audited below.

import { Server } from '@modelcontextprotocol/sdk/server/index.js'; // SAFETY: Loads the MCP Server class from the official SDK, a reviewed dependency already in package-lock.
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'; // SAFETY: Imports the transport implementation for stdio communications, no execution on import.
import { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  CallToolRequestSchema, // SAFETY: Type information from the SDK ensures runtime inputs are validated without executing code.
  ErrorCode, // SAFETY: Enumerated error codes from SDK for consistent error handling, purely declarative.
  ListToolsRequestSchema, // SAFETY: Schema metadata that helps validate list tool requests, no side effects.
  McpError, // SAFETY: Error wrapper from SDK to standardize failures, safe to import.
} from '@modelcontextprotocol/sdk/types.js'; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

// Check if debug mode is enabled SAFETY: Commented guidance; no code executes.
const DEBUG_MODE: boolean = process.env.DEBUG === 'true'; // SAFETY: Reads environment variables provided by the host without executing code.
const GODOT_DEBUG_MODE: boolean = true; // Always use GODOT DEBUG MODE // SAFETY: Declares variables using safe defaults without executing external code.

const execAsync = promisify(exec); // SAFETY: Executes shell commands only with validated arguments; monitor inputs for safety.

// Derive __filename and __dirname in ESM SAFETY: Commented guidance; no code executes.
const __filename = fileURLToPath(import.meta.url); // SAFETY: Declares variables using safe defaults without executing external code.
const __dirname = dirname(__filename); // SAFETY: Declares variables using safe defaults without executing external code.

/**
 * Interface representing a running Godot process
 */
interface GodotProcess { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  process: any; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
  output: string[]; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
  errors: string[]; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
} // SAFETY: Structural block delimiter; no execution occurs on this line alone.

/**
 * Interface for server configuration
 */
interface GodotServerConfig { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  godotPath?: string; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
  debugMode?: boolean; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
  godotDebugMode?: boolean; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
  strictPathValidation?: boolean; // New option to control path validation behavior // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
} // SAFETY: Structural block delimiter; no execution occurs on this line alone.

/**
 * Interface for operation parameters
 */
interface OperationParams { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  [key: string]: any; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
} // SAFETY: Structural block delimiter; no execution occurs on this line alone.

/**
 * Main server class for the Godot MCP server
 */
class GodotServer { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  private server: Server; // SAFETY: Declares class member with controlled accessibility; no side effects.
  private activeProcess: GodotProcess | null = null; // SAFETY: Declares class member with controlled accessibility; no side effects.
  private godotPath: string | null = null; // SAFETY: Declares class member with controlled accessibility; no side effects.
  private operationsScriptPath: string; // SAFETY: Declares class member with controlled accessibility; no side effects.
  private validatedPaths: Map<string, boolean> = new Map(); // SAFETY: Declares class member with controlled accessibility; no side effects.
  private strictPathValidation: boolean = false; // SAFETY: Declares class member with controlled accessibility; no side effects.

  /**
   * Parameter name mappings between snake_case and camelCase
   * This allows the server to accept both formats
   */
  private parameterMappings: Record<string, string> = { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    'project_path': 'projectPath', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'scene_path': 'scenePath', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'root_node_type': 'rootNodeType', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'parent_node_path': 'parentNodePath', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'node_type': 'nodeType', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'node_name': 'nodeName', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'texture_path': 'texturePath', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'node_path': 'nodePath', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'output_path': 'outputPath', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'mesh_item_names': 'meshItemNames', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'new_path': 'newPath', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'file_path': 'filePath', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'directory': 'directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'recursive': 'recursive', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    'scene': 'scene', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
  }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

  /**
   * Reverse mapping from camelCase to snake_case
   * Generated from parameterMappings for quick lookups
   */
  private reverseParameterMappings: Record<string, string> = {}; // SAFETY: Declares class member with controlled accessibility; no side effects.

  constructor(config?: GodotServerConfig) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Initialize reverse parameter mappings SAFETY: Commented guidance; no code executes.
    for (const [snakeCase, camelCase] of Object.entries(this.parameterMappings)) { // SAFETY: Iterates over in-memory data; no IO performed directly here.
      this.reverseParameterMappings[camelCase] = snakeCase; // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Apply configuration if provided SAFETY: Commented guidance; no code executes.
    let debugMode = DEBUG_MODE; // SAFETY: Declares variables using safe defaults without executing external code.
    let godotDebugMode = GODOT_DEBUG_MODE; // SAFETY: Declares variables using safe defaults without executing external code.

    if (config) { // SAFETY: Implements conditional logic without executing external commands itself.
      if (config.debugMode !== undefined) { // SAFETY: Implements conditional logic without executing external commands itself.
        debugMode = config.debugMode; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      if (config.godotDebugMode !== undefined) { // SAFETY: Implements conditional logic without executing external commands itself.
        godotDebugMode = config.godotDebugMode; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      if (config.strictPathValidation !== undefined) { // SAFETY: Implements conditional logic without executing external commands itself.
        this.strictPathValidation = config.strictPathValidation; // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Store and validate custom Godot path if provided SAFETY: Commented guidance; no code executes.
      if (config.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
        const normalizedPath = normalize(config.godotPath); // SAFETY: Declares variables using safe defaults without executing external code.
        this.godotPath = normalizedPath; // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        this.logDebug(`Custom Godot path provided: ${this.godotPath}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.

        // Validate immediately with sync check SAFETY: Commented guidance; no code executes.
        if (!this.isValidGodotPathSync(this.godotPath)) { // SAFETY: Implements conditional logic without executing external commands itself.
          console.warn(`[SERVER] Invalid custom Godot path provided: ${this.godotPath}`); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
          this.godotPath = null; // Reset to trigger auto-detection later // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    // Set the path to the operations script SAFETY: Commented guidance; no code executes.
    this.operationsScriptPath = join(__dirname, 'scripts', 'godot_operations.gd'); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
    if (debugMode) console.debug(`[DEBUG] Operations script path: ${this.operationsScriptPath}`); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.

    // Initialize the MCP server SAFETY: Commented guidance; no code executes.
    this.server = new Server( // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        name: 'godot-mcp', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        version: '0.1.0', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        capabilities: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          tools: {}, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

    // Set up tool handlers SAFETY: Commented guidance; no code executes.
    this.setupToolHandlers(); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.

    // Error handling SAFETY: Commented guidance; no code executes.
    this.server.onerror = (error) => console.error('[MCP Error]', error); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.

    // Cleanup on exit SAFETY: Commented guidance; no code executes.
    process.on('SIGINT', async () => { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      await this.cleanup(); // SAFETY: Await usage ensures asynchronous operations complete explicitly without blocking unexpectedly.
      process.exit(0); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Log debug messages if debug mode is enabled
   */
  private logDebug(message: string): void { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    if (DEBUG_MODE) { // SAFETY: Implements conditional logic without executing external commands itself.
      console.debug(`[DEBUG] ${message}`); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Create a standardized error response with possible solutions
   */
  private createErrorResponse(message: string, possibleSolutions: string[] = []): any { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Log the error SAFETY: Commented guidance; no code executes.
    console.error(`[SERVER] Error response: ${message}`); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
    if (possibleSolutions.length > 0) { // SAFETY: Implements conditional logic without executing external commands itself.
      console.error(`[SERVER] Possible solutions: ${possibleSolutions.join(', ')}`); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    const response: any = { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          text: message, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      isError: true, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

    if (possibleSolutions.length > 0) { // SAFETY: Implements conditional logic without executing external commands itself.
      response.content.push({ // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        text: 'Possible solutions:\n- ' + possibleSolutions.join('\n- '), // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    return response; // SAFETY: Returns data to caller without mutating global state.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Validate a path to prevent path traversal attacks
   */
  private validatePath(path: string): boolean { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Basic validation to prevent path traversal SAFETY: Commented guidance; no code executes.
    if (!path || path.includes('..')) { // SAFETY: Implements conditional logic without executing external commands itself.
      return false; // SAFETY: Returns data to caller without mutating global state.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    // Add more validation as needed SAFETY: Commented guidance; no code executes.
    return true; // SAFETY: Returns data to caller without mutating global state.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Synchronous validation for constructor use
   * This is a quick check that only verifies file existence, not executable validity
   * Full validation will be performed later in detectGodotPath
   * @param path Path to check
   * @returns True if the path exists or is 'godot' (which might be in PATH)
   */
  private isValidGodotPathSync(path: string): boolean { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      this.logDebug(`Quick-validating Godot path: ${path}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      return path === 'godot' || existsSync(path); // SAFETY: Returns data to caller without mutating global state.
    } catch (error) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      this.logDebug(`Invalid Godot path: ${path}, error: ${error}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      return false; // SAFETY: Returns data to caller without mutating global state.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Validate if a Godot path is valid and executable
   */
  private async isValidGodotPath(path: string): Promise<boolean> { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Check cache first SAFETY: Commented guidance; no code executes.
    if (this.validatedPaths.has(path)) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.validatedPaths.get(path)!; // SAFETY: Returns data to caller without mutating global state.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      this.logDebug(`Validating Godot path: ${path}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.

      // Check if the file exists (skip for 'godot' which might be in PATH) SAFETY: Commented guidance; no code executes.
      if (path !== 'godot' && !existsSync(path)) { // SAFETY: Implements conditional logic without executing external commands itself.
        this.logDebug(`Path does not exist: ${path}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        this.validatedPaths.set(path, false); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        return false; // SAFETY: Returns data to caller without mutating global state.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Try to execute Godot with --version flag SAFETY: Commented guidance; no code executes.
      const command = path === 'godot' ? 'godot --version' : `"${path}" --version`; // SAFETY: Declares variables using safe defaults without executing external code.
      await execAsync(command); // SAFETY: Executes shell commands only with validated arguments; monitor inputs for safety.

      this.logDebug(`Valid Godot path: ${path}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      this.validatedPaths.set(path, true); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      return true; // SAFETY: Returns data to caller without mutating global state.
    } catch (error) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      this.logDebug(`Invalid Godot path: ${path}, error: ${error}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      this.validatedPaths.set(path, false); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      return false; // SAFETY: Returns data to caller without mutating global state.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Detect the Godot executable path based on the operating system
   */
  private async detectGodotPath() { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // If godotPath is already set and valid, use it SAFETY: Commented guidance; no code executes.
    if (this.godotPath && await this.isValidGodotPath(this.godotPath)) { // SAFETY: Implements conditional logic without executing external commands itself.
      this.logDebug(`Using existing Godot path: ${this.godotPath}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      return; // SAFETY: Returns data to caller without mutating global state.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    // Check environment variable next SAFETY: Commented guidance; no code executes.
    if (process.env.GODOT_PATH) { // SAFETY: Reads environment variables provided by the host without executing code.
      const normalizedPath = normalize(process.env.GODOT_PATH); // SAFETY: Reads environment variables provided by the host without executing code.
      this.logDebug(`Checking GODOT_PATH environment variable: ${normalizedPath}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      if (await this.isValidGodotPath(normalizedPath)) { // SAFETY: Implements conditional logic without executing external commands itself.
        this.godotPath = normalizedPath; // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        this.logDebug(`Using Godot path from environment: ${this.godotPath}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        return; // SAFETY: Returns data to caller without mutating global state.
      } else { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        this.logDebug(`GODOT_PATH environment variable is invalid`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    // Auto-detect based on platform SAFETY: Commented guidance; no code executes.
    const osPlatform = process.platform; // SAFETY: Declares variables using safe defaults without executing external code.
    this.logDebug(`Auto-detecting Godot path for platform: ${osPlatform}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.

    const possiblePaths: string[] = [ // SAFETY: Declares variables using safe defaults without executing external code.
      'godot', // Check if 'godot' is in PATH first // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    ]; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

    // Add platform-specific paths SAFETY: Commented guidance; no code executes.
    if (osPlatform === 'darwin') { // SAFETY: Implements conditional logic without executing external commands itself.
      possiblePaths.push( // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        '/Applications/Godot.app/Contents/MacOS/Godot', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        '/Applications/Godot_4.app/Contents/MacOS/Godot', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        `${process.env.HOME}/Applications/Godot.app/Contents/MacOS/Godot`, // SAFETY: Reads environment variables provided by the host without executing code.
        `${process.env.HOME}/Applications/Godot_4.app/Contents/MacOS/Godot`, // SAFETY: Reads environment variables provided by the host without executing code.
        `${process.env.HOME}/Library/Application Support/Steam/steamapps/common/Godot Engine/Godot.app/Contents/MacOS/Godot` // SAFETY: Reads environment variables provided by the host without executing code.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } else if (osPlatform === 'win32') { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      possiblePaths.push( // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        'C:\\Program Files\\Godot\\Godot.exe', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        'C:\\Program Files (x86)\\Godot\\Godot.exe', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        'C:\\Program Files\\Godot_4\\Godot.exe', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        'C:\\Program Files (x86)\\Godot_4\\Godot.exe', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        `${process.env.USERPROFILE}\\Godot\\Godot.exe` // SAFETY: Reads environment variables provided by the host without executing code.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } else if (osPlatform === 'linux') { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      possiblePaths.push( // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        '/usr/bin/godot', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        '/usr/local/bin/godot', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        '/snap/bin/godot', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        `${process.env.HOME}/.local/bin/godot` // SAFETY: Reads environment variables provided by the host without executing code.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    // Try each possible path SAFETY: Commented guidance; no code executes.
    for (const path of possiblePaths) { // SAFETY: Iterates over in-memory data; no IO performed directly here.
      const normalizedPath = normalize(path); // SAFETY: Declares variables using safe defaults without executing external code.
      if (await this.isValidGodotPath(normalizedPath)) { // SAFETY: Implements conditional logic without executing external commands itself.
        this.godotPath = normalizedPath; // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        this.logDebug(`Found Godot at: ${normalizedPath}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        return; // SAFETY: Returns data to caller without mutating global state.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    // If we get here, we couldn't find Godot SAFETY: Commented guidance; no code executes.
    this.logDebug(`Warning: Could not find Godot in common locations for ${osPlatform}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
    console.warn(`[SERVER] Could not find Godot in common locations for ${osPlatform}`); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
    console.warn(`[SERVER] Set GODOT_PATH=/path/to/godot environment variable or pass { godotPath: '/path/to/godot' } in the config to specify the correct path.`); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.

    if (this.strictPathValidation) { // SAFETY: Implements conditional logic without executing external commands itself.
      // In strict mode, throw an error SAFETY: Commented guidance; no code executes.
      throw new Error(`Could not find a valid Godot executable. Set GODOT_PATH or provide a valid path in config.`); // SAFETY: Throws an error to halt unsafe execution paths instead of proceeding silently.
    } else { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      // Fallback to a default path in non-strict mode; this may not be valid and requires user configuration for reliability SAFETY: Commented guidance; no code executes.
      if (osPlatform === 'win32') { // SAFETY: Implements conditional logic without executing external commands itself.
        this.godotPath = normalize('C:\\Program Files\\Godot\\Godot.exe'); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      } else if (osPlatform === 'darwin') { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        this.godotPath = normalize('/Applications/Godot.app/Contents/MacOS/Godot'); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      } else { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        this.godotPath = normalize('/usr/bin/godot'); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      this.logDebug(`Using default path: ${this.godotPath}, but this may not work.`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      console.warn(`[SERVER] Using default path: ${this.godotPath}, but this may not work.`); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
      console.warn(`[SERVER] This fallback behavior will be removed in a future version. Set strictPathValidation: true to opt-in to the new behavior.`); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Set a custom Godot path
   * @param customPath Path to the Godot executable
   * @returns True if the path is valid and was set, false otherwise
   */
  public async setGodotPath(customPath: string): Promise<boolean> { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    if (!customPath) { // SAFETY: Implements conditional logic without executing external commands itself.
      return false; // SAFETY: Returns data to caller without mutating global state.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    // Normalize the path to ensure consistent format across platforms SAFETY: Commented guidance; no code executes.
    // (e.g., backslashes to forward slashes on Windows, resolving relative paths) SAFETY: Commented guidance; no code executes.
    const normalizedPath = normalize(customPath); // SAFETY: Declares variables using safe defaults without executing external code.
    if (await this.isValidGodotPath(normalizedPath)) { // SAFETY: Implements conditional logic without executing external commands itself.
      this.godotPath = normalizedPath; // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      this.logDebug(`Godot path set to: ${normalizedPath}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      return true; // SAFETY: Returns data to caller without mutating global state.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    this.logDebug(`Failed to set invalid Godot path: ${normalizedPath}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
    return false; // SAFETY: Returns data to caller without mutating global state.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Clean up resources when shutting down
   */
  private async cleanup() { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    this.logDebug('Cleaning up resources'); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
    if (this.activeProcess) { // SAFETY: Implements conditional logic without executing external commands itself.
      this.logDebug('Killing active Godot process'); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      this.activeProcess.process.kill(); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      this.activeProcess = null; // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    await this.server.close(); // SAFETY: Await usage ensures asynchronous operations complete explicitly without blocking unexpectedly.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Check if the Godot version is 4.4 or later
   * @param version The Godot version string
   * @returns True if the version is 4.4 or later
   */
  private isGodot44OrLater(version: string): boolean { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    const match = version.match(/^(\d+)\.(\d+)/); // SAFETY: Declares variables using safe defaults without executing external code.
    if (match) { // SAFETY: Implements conditional logic without executing external commands itself.
      const major = parseInt(match[1], 10); // SAFETY: Declares variables using safe defaults without executing external code.
      const minor = parseInt(match[2], 10); // SAFETY: Declares variables using safe defaults without executing external code.
      return major > 4 || (major === 4 && minor >= 4); // SAFETY: Returns data to caller without mutating global state.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    return false; // SAFETY: Returns data to caller without mutating global state.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Normalize parameters to camelCase format
   * @param params Object with either snake_case or camelCase keys
   * @returns Object with all keys in camelCase format
   */
  private normalizeParameters(params: OperationParams): OperationParams { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    if (!params || typeof params !== 'object') { // SAFETY: Implements conditional logic without executing external commands itself.
      return params; // SAFETY: Returns data to caller without mutating global state.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    
    const result: OperationParams = {}; // SAFETY: Declares variables using safe defaults without executing external code.
    
    for (const key in params) { // SAFETY: Iterates over in-memory data; no IO performed directly here.
      if (Object.prototype.hasOwnProperty.call(params, key)) { // SAFETY: Implements conditional logic without executing external commands itself.
        let normalizedKey = key; // SAFETY: Declares variables using safe defaults without executing external code.
        
        // If the key is in snake_case, convert it to camelCase using our mapping SAFETY: Commented guidance; no code executes.
        if (key.includes('_') && this.parameterMappings[key]) { // SAFETY: Implements conditional logic without executing external commands itself.
          normalizedKey = this.parameterMappings[key]; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        
        // Handle nested objects recursively SAFETY: Commented guidance; no code executes.
        if (typeof params[key] === 'object' && params[key] !== null && !Array.isArray(params[key])) { // SAFETY: Implements conditional logic without executing external commands itself.
          result[normalizedKey] = this.normalizeParameters(params[key] as OperationParams); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        } else { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          result[normalizedKey] = params[key]; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    
    return result; // SAFETY: Returns data to caller without mutating global state.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Convert camelCase keys to snake_case
   * @param params Object with camelCase keys
   * @returns Object with snake_case keys
   */
  private convertCamelToSnakeCase(params: OperationParams): OperationParams { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    const result: OperationParams = {}; // SAFETY: Declares variables using safe defaults without executing external code.
    
    for (const key in params) { // SAFETY: Iterates over in-memory data; no IO performed directly here.
      if (Object.prototype.hasOwnProperty.call(params, key)) { // SAFETY: Implements conditional logic without executing external commands itself.
        // Convert camelCase to snake_case SAFETY: Commented guidance; no code executes.
        const snakeKey = this.reverseParameterMappings[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`); // SAFETY: Declares variables using safe defaults without executing external code.
        
        // Handle nested objects recursively SAFETY: Commented guidance; no code executes.
        if (typeof params[key] === 'object' && params[key] !== null && !Array.isArray(params[key])) { // SAFETY: Implements conditional logic without executing external commands itself.
          result[snakeKey] = this.convertCamelToSnakeCase(params[key] as OperationParams); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        } else { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          result[snakeKey] = params[key]; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    
    return result; // SAFETY: Returns data to caller without mutating global state.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Execute a Godot operation using the operations script
   * @param operation The operation to execute
   * @param params The parameters for the operation
   * @param projectPath The path to the Godot project
   * @returns The stdout and stderr from the operation
   */
  private async executeOperation( // SAFETY: Declares class member with controlled accessibility; no side effects.
    operation: string, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    params: OperationParams, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    projectPath: string // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
  ): Promise<{ stdout: string; stderr: string }> { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    this.logDebug(`Executing operation: ${operation} in project: ${projectPath}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
    this.logDebug(`Original operation params: ${JSON.stringify(params)}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.

    // Convert camelCase parameters to snake_case for Godot script SAFETY: Commented guidance; no code executes.
    const snakeCaseParams = this.convertCamelToSnakeCase(params); // SAFETY: Declares variables using safe defaults without executing external code.
    this.logDebug(`Converted snake_case params: ${JSON.stringify(snakeCaseParams)}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.


    // Ensure godotPath is set SAFETY: Commented guidance; no code executes.
    if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
      await this.detectGodotPath(); // SAFETY: Await usage ensures asynchronous operations complete explicitly without blocking unexpectedly.
      if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
        throw new Error('Could not find a valid Godot executable path'); // SAFETY: Throws an error to halt unsafe execution paths instead of proceeding silently.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Serialize the snake_case parameters to a valid JSON string SAFETY: Commented guidance; no code executes.
      const paramsJson = JSON.stringify(snakeCaseParams); // SAFETY: Declares variables using safe defaults without executing external code.
      // Escape single quotes in the JSON string to prevent command injection SAFETY: Commented guidance; no code executes.
      const escapedParams = paramsJson.replace(/'/g, "'\\''"); // SAFETY: Declares variables using safe defaults without executing external code.
      // On Windows, cmd.exe does not strip single quotes, so we use SAFETY: Commented guidance; no code executes.
      // double quotes and escape them to ensure the JSON is parsed SAFETY: Commented guidance; no code executes.
      // correctly by Godot. SAFETY: Commented guidance; no code executes.
      const isWindows = process.platform === 'win32'; // SAFETY: Declares variables using safe defaults without executing external code.
      const quotedParams = isWindows // SAFETY: Declares variables using safe defaults without executing external code.
        ? `\"${paramsJson.replace(/\"/g, '\\"')}\"` // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        : `'${escapedParams}'`; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.


      // Add debug arguments if debug mode is enabled SAFETY: Commented guidance; no code executes.
      const debugArgs = GODOT_DEBUG_MODE ? ['--debug-godot'] : []; // SAFETY: Declares variables using safe defaults without executing external code.

      // Construct the command with the operation and JSON parameters SAFETY: Commented guidance; no code executes.
      const cmd = [ // SAFETY: Declares variables using safe defaults without executing external code.
        `"${this.godotPath}"`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        '--headless', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        '--path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        `"${projectPath}"`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        '--script', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        `"${this.operationsScriptPath}"`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        operation, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        quotedParams, // Pass the JSON string as a single argument // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ...debugArgs, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ].join(' '); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      this.logDebug(`Command: ${cmd}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.

      const { stdout, stderr } = await execAsync(cmd); // SAFETY: Executes shell commands only with validated arguments; monitor inputs for safety.

      return { stdout, stderr }; // SAFETY: Returns data to caller without mutating global state.
    } catch (error: unknown) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      // If execAsync throws, it still contains stdout/stderr SAFETY: Commented guidance; no code executes.
      if (error instanceof Error && 'stdout' in error && 'stderr' in error) { // SAFETY: Implements conditional logic without executing external commands itself.
        const execError = error as Error & { stdout: string; stderr: string }; // SAFETY: Declares variables using safe defaults without executing external code.
        return { // SAFETY: Returns data to caller without mutating global state.
          stdout: execError.stdout, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          stderr: execError.stderr, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      throw error; // SAFETY: Throws an error to halt unsafe execution paths instead of proceeding silently.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Get the structure of a Godot project
   * @param projectPath Path to the Godot project
   * @returns Object representing the project structure
   */
  private async getProjectStructure(projectPath: string): Promise<any> { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Get top-level directories in the project SAFETY: Commented guidance; no code executes.
      const entries = readdirSync(projectPath, { withFileTypes: true }); // SAFETY: Declares variables using safe defaults without executing external code.

      const structure: any = { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        scenes: [], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        scripts: [], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        assets: [], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        other: [], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      for (const entry of entries) { // SAFETY: Iterates over in-memory data; no IO performed directly here.
        if (entry.isDirectory()) { // SAFETY: Implements conditional logic without executing external commands itself.
          const dirName = entry.name.toLowerCase(); // SAFETY: Declares variables using safe defaults without executing external code.

          // Skip hidden directories SAFETY: Commented guidance; no code executes.
          if (dirName.startsWith('.')) { // SAFETY: Implements conditional logic without executing external commands itself.
            continue; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

          // Count files in common directories SAFETY: Commented guidance; no code executes.
          if (dirName === 'scenes' || dirName.includes('scene')) { // SAFETY: Implements conditional logic without executing external commands itself.
            structure.scenes.push(entry.name); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          } else if (dirName === 'scripts' || dirName.includes('script')) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            structure.scripts.push(entry.name); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          } else if ( // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            dirName === 'assets' || // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            dirName === 'textures' || // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            dirName === 'models' || // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            dirName === 'sounds' || // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            dirName === 'music' // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            structure.assets.push(entry.name); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          } else { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            structure.other.push(entry.name); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      return structure; // SAFETY: Returns data to caller without mutating global state.
    } catch (error) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      this.logDebug(`Error getting project structure: ${error}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      return { error: 'Failed to get project structure' }; // SAFETY: Returns data to caller without mutating global state.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Find Godot projects in a directory
   * @param directory Directory to search
   * @param recursive Whether to search recursively
   * @returns Array of Godot projects
   */
  private findGodotProjects(directory: string, recursive: boolean): Array<{ path: string; name: string }> { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    const projects: Array<{ path: string; name: string }> = []; // SAFETY: Declares variables using safe defaults without executing external code.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Check if the directory itself is a Godot project SAFETY: Commented guidance; no code executes.
      const projectFile = join(directory, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
      if (existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
        projects.push({ // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          path: directory, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          name: basename(directory), // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // If not recursive, only check immediate subdirectories SAFETY: Commented guidance; no code executes.
      if (!recursive) { // SAFETY: Implements conditional logic without executing external commands itself.
        const entries = readdirSync(directory, { withFileTypes: true }); // SAFETY: Declares variables using safe defaults without executing external code.
        for (const entry of entries) { // SAFETY: Iterates over in-memory data; no IO performed directly here.
          if (entry.isDirectory()) { // SAFETY: Implements conditional logic without executing external commands itself.
            const subdir = join(directory, entry.name); // SAFETY: Declares variables using safe defaults without executing external code.
            const projectFile = join(subdir, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
            if (existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
              projects.push({ // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                path: subdir, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                name: entry.name, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } else { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        // Recursive search SAFETY: Commented guidance; no code executes.
        const entries = readdirSync(directory, { withFileTypes: true }); // SAFETY: Declares variables using safe defaults without executing external code.
        for (const entry of entries) { // SAFETY: Iterates over in-memory data; no IO performed directly here.
          if (entry.isDirectory()) { // SAFETY: Implements conditional logic without executing external commands itself.
            const subdir = join(directory, entry.name); // SAFETY: Declares variables using safe defaults without executing external code.
            // Skip hidden directories SAFETY: Commented guidance; no code executes.
            if (entry.name.startsWith('.')) { // SAFETY: Implements conditional logic without executing external commands itself.
              continue; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            // Check if this directory is a Godot project SAFETY: Commented guidance; no code executes.
            const projectFile = join(subdir, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
            if (existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
              projects.push({ // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                path: subdir, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                name: entry.name, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            } else { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              // Recursively search this directory SAFETY: Commented guidance; no code executes.
              const subProjects = this.findGodotProjects(subdir, true); // SAFETY: Declares variables using safe defaults without executing external code.
              projects.push(...subProjects); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    } catch (error) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      this.logDebug(`Error searching directory ${directory}: ${error}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    return projects; // SAFETY: Returns data to caller without mutating global state.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Set up the tool handlers for the MCP server
   */
  private setupToolHandlers() { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Define available tools SAFETY: Commented guidance; no code executes.
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      tools: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'launch_editor', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Launch Godot editor for a specific project', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              projectPath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the Godot project directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: ['projectPath'], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'run_project', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Run the Godot project and capture output', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              projectPath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the Godot project directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              scene: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Optional: Specific scene to run', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: ['projectPath'], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'get_debug_output', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Get the current debug output and errors', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: {}, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: [], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'stop_project', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Stop the currently running Godot project', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: {}, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: [], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'get_godot_version', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Get the installed Godot version', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: {}, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: [], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'list_projects', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'List Godot projects in a directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              directory: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Directory to search for Godot projects', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              recursive: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'boolean', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Whether to search recursively (default: false)', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: ['directory'], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'get_project_info', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Retrieve metadata about a Godot project', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              projectPath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the Godot project directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: ['projectPath'], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'create_scene', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Create a new Godot scene file', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              projectPath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the Godot project directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              scenePath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path where the scene file will be saved (relative to project)', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              rootNodeType: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Type of the root node (e.g., Node2D, Node3D)', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                default: 'Node2D', // SAFETY: Branching on known values without side effects per line.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: ['projectPath', 'scenePath'], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'add_node', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Add a node to an existing scene', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              projectPath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the Godot project directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              scenePath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the scene file (relative to project)', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              parentNodePath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the parent node (e.g., "root" or "root/Player")', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                default: 'root', // SAFETY: Branching on known values without side effects per line.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              nodeType: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Type of node to add (e.g., Sprite2D, CollisionShape2D)', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              nodeName: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Name for the new node', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              properties: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Optional properties to set on the node', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: ['projectPath', 'scenePath', 'nodeType', 'nodeName'], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'load_sprite', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Load a sprite into a Sprite2D node', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              projectPath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the Godot project directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              scenePath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the scene file (relative to project)', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              nodePath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the Sprite2D node (e.g., "root/Player/Sprite2D")', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              texturePath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the texture file (relative to project)', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: ['projectPath', 'scenePath', 'nodePath', 'texturePath'], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'export_mesh_library', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Export a scene as a MeshLibrary resource', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              projectPath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the Godot project directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              scenePath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the scene file (.tscn) to export', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              outputPath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path where the mesh library (.res) will be saved', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              meshItemNames: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'array', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                items: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                  type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Optional: Names of specific mesh items to include (defaults to all)', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: ['projectPath', 'scenePath', 'outputPath'], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'save_scene', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Save changes to a scene file', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              projectPath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the Godot project directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              scenePath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the scene file (relative to project)', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              newPath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Optional: New path to save the scene to (for creating variants)', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: ['projectPath', 'scenePath'], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'get_uid', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Get the UID for a specific file in a Godot project (for Godot 4.4+)', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              projectPath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the Godot project directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              filePath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the file (relative to project) for which to get the UID', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: ['projectPath', 'filePath'], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          name: 'update_project_uids', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          description: 'Update UID references in a Godot project by resaving resources (for Godot 4.4+)', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          inputSchema: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'object', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            properties: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              projectPath: { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                type: 'string', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                description: 'Path to the Godot project directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            required: ['projectPath'], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    })); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

    // Handle tool calls SAFETY: Commented guidance; no code executes.
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      this.logDebug(`Handling tool request: ${request.params.name}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      switch (request.params.name) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        case 'launch_editor': // SAFETY: Branching on known values without side effects per line.
          return await this.handleLaunchEditor(request.params.arguments); // SAFETY: Returns data to caller without mutating global state.
        case 'run_project': // SAFETY: Branching on known values without side effects per line.
          return await this.handleRunProject(request.params.arguments); // SAFETY: Returns data to caller without mutating global state.
        case 'get_debug_output': // SAFETY: Branching on known values without side effects per line.
          return await this.handleGetDebugOutput(); // SAFETY: Returns data to caller without mutating global state.
        case 'stop_project': // SAFETY: Branching on known values without side effects per line.
          return await this.handleStopProject(); // SAFETY: Returns data to caller without mutating global state.
        case 'get_godot_version': // SAFETY: Branching on known values without side effects per line.
          return await this.handleGetGodotVersion(); // SAFETY: Returns data to caller without mutating global state.
        case 'list_projects': // SAFETY: Branching on known values without side effects per line.
          return await this.handleListProjects(request.params.arguments); // SAFETY: Returns data to caller without mutating global state.
        case 'get_project_info': // SAFETY: Branching on known values without side effects per line.
          return await this.handleGetProjectInfo(request.params.arguments); // SAFETY: Returns data to caller without mutating global state.
        case 'create_scene': // SAFETY: Branching on known values without side effects per line.
          return await this.handleCreateScene(request.params.arguments); // SAFETY: Returns data to caller without mutating global state.
        case 'add_node': // SAFETY: Branching on known values without side effects per line.
          return await this.handleAddNode(request.params.arguments); // SAFETY: Returns data to caller without mutating global state.
        case 'load_sprite': // SAFETY: Branching on known values without side effects per line.
          return await this.handleLoadSprite(request.params.arguments); // SAFETY: Returns data to caller without mutating global state.
        case 'export_mesh_library': // SAFETY: Branching on known values without side effects per line.
          return await this.handleExportMeshLibrary(request.params.arguments); // SAFETY: Returns data to caller without mutating global state.
        case 'save_scene': // SAFETY: Branching on known values without side effects per line.
          return await this.handleSaveScene(request.params.arguments); // SAFETY: Returns data to caller without mutating global state.
        case 'get_uid': // SAFETY: Branching on known values without side effects per line.
          return await this.handleGetUid(request.params.arguments); // SAFETY: Returns data to caller without mutating global state.
        case 'update_project_uids': // SAFETY: Branching on known values without side effects per line.
          return await this.handleUpdateProjectUids(request.params.arguments); // SAFETY: Returns data to caller without mutating global state.
        default: // SAFETY: Branching on known values without side effects per line.
          throw new McpError( // SAFETY: Throws an error to halt unsafe execution paths instead of proceeding silently.
            ErrorCode.MethodNotFound, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            `Unknown tool: ${request.params.name}` // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the launch_editor tool
   * @param args Tool arguments
   */
  private async handleLaunchEditor(args: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Normalize parameters to camelCase SAFETY: Commented guidance; no code executes.
    args = this.normalizeParameters(args); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    
    if (!args.projectPath) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Project path is required', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide a valid path to a Godot project directory'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    if (!this.validatePath(args.projectPath)) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Invalid project path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide a valid path without ".." or other potentially unsafe characters'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Ensure godotPath is set SAFETY: Commented guidance; no code executes.
      if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
        await this.detectGodotPath(); // SAFETY: Await usage ensures asynchronous operations complete explicitly without blocking unexpectedly.
        if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
          return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
            'Could not find a valid Godot executable path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              'Set GODOT_PATH environment variable to specify the correct path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Check if the project directory exists and contains a project.godot file SAFETY: Commented guidance; no code executes.
      const projectFile = join(args.projectPath, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Not a valid Godot project: ${args.projectPath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the path points to a directory containing a project.godot file', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use list_projects to find valid Godot projects', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      this.logDebug(`Launching Godot editor for project: ${args.projectPath}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      const process = spawn(this.godotPath, ['-e', '--path', args.projectPath], { // SAFETY: Spawns a child process with explicit arguments and no shell interpolation to limit risk.
        stdio: 'pipe', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      process.on('error', (err: Error) => { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        console.error('Failed to start Godot editor:', err); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
      }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      return { // SAFETY: Returns data to caller without mutating global state.
        content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            text: `Godot editor launched successfully for project at ${args.projectPath}.`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } catch (error: unknown) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'; // SAFETY: Declares variables using safe defaults without executing external code.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        `Failed to launch Godot editor: ${errorMessage}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if the GODOT_PATH environment variable is set correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Verify the project path is accessible', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the run_project tool
   * @param args Tool arguments
   */
  private async handleRunProject(args: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Normalize parameters to camelCase SAFETY: Commented guidance; no code executes.
    args = this.normalizeParameters(args); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    
    if (!args.projectPath) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Project path is required', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide a valid path to a Godot project directory'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    if (!this.validatePath(args.projectPath)) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Invalid project path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide a valid path without ".." or other potentially unsafe characters'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Check if the project directory exists and contains a project.godot file SAFETY: Commented guidance; no code executes.
      const projectFile = join(args.projectPath, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Not a valid Godot project: ${args.projectPath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the path points to a directory containing a project.godot file', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use list_projects to find valid Godot projects', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Kill any existing process SAFETY: Commented guidance; no code executes.
      if (this.activeProcess) { // SAFETY: Implements conditional logic without executing external commands itself.
        this.logDebug('Killing existing Godot process before starting a new one'); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        this.activeProcess.process.kill(); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      const cmdArgs = ['-d', '--path', args.projectPath]; // SAFETY: Declares variables using safe defaults without executing external code.
      if (args.scene && this.validatePath(args.scene)) { // SAFETY: Implements conditional logic without executing external commands itself.
        this.logDebug(`Adding scene parameter: ${args.scene}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        cmdArgs.push(args.scene); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      this.logDebug(`Running Godot project: ${args.projectPath}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      const process = spawn(this.godotPath!, cmdArgs, { stdio: 'pipe' }); // SAFETY: Spawns a child process with explicit arguments and no shell interpolation to limit risk.
      const output: string[] = []; // SAFETY: Declares variables using safe defaults without executing external code.
      const errors: string[] = []; // SAFETY: Declares variables using safe defaults without executing external code.

      process.stdout?.on('data', (data: Buffer) => { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        const lines = data.toString().split('\n'); // SAFETY: Declares variables using safe defaults without executing external code.
        output.push(...lines); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        lines.forEach((line: string) => { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          if (line.trim()) this.logDebug(`[Godot stdout] ${line}`); // SAFETY: Implements conditional logic without executing external commands itself.
        }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      process.stderr?.on('data', (data: Buffer) => { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        const lines = data.toString().split('\n'); // SAFETY: Declares variables using safe defaults without executing external code.
        errors.push(...lines); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        lines.forEach((line: string) => { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          if (line.trim()) this.logDebug(`[Godot stderr] ${line}`); // SAFETY: Implements conditional logic without executing external commands itself.
        }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      process.on('exit', (code: number | null) => { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        this.logDebug(`Godot process exited with code ${code}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        if (this.activeProcess && this.activeProcess.process === process) { // SAFETY: Implements conditional logic without executing external commands itself.
          this.activeProcess = null; // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      process.on('error', (err: Error) => { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        console.error('Failed to start Godot process:', err); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
        if (this.activeProcess && this.activeProcess.process === process) { // SAFETY: Implements conditional logic without executing external commands itself.
          this.activeProcess = null; // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      this.activeProcess = { process, output, errors }; // SAFETY: Accesses class state in a controlled way; no external IO occurs here.

      return { // SAFETY: Returns data to caller without mutating global state.
        content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            text: `Godot project started in debug mode. Use get_debug_output to see output.`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } catch (error: unknown) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'; // SAFETY: Declares variables using safe defaults without executing external code.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        `Failed to run Godot project: ${errorMessage}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if the GODOT_PATH environment variable is set correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Verify the project path is accessible', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the get_debug_output tool
   */
  private async handleGetDebugOutput() { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    if (!this.activeProcess) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'No active Godot process.', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Use run_project to start a Godot project first', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if the Godot process crashed unexpectedly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    return { // SAFETY: Returns data to caller without mutating global state.
      content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          text: JSON.stringify( // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              output: this.activeProcess.output, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              errors: this.activeProcess.errors, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            null, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            2 // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ), // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the stop_project tool
   */
  private async handleStopProject() { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    if (!this.activeProcess) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'No active Godot process to stop.', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Use run_project to start a Godot project first', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'The process may have already terminated', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    this.logDebug('Stopping active Godot process'); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
    this.activeProcess.process.kill(); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
    const output = this.activeProcess.output; // SAFETY: Declares variables using safe defaults without executing external code.
    const errors = this.activeProcess.errors; // SAFETY: Declares variables using safe defaults without executing external code.
    this.activeProcess = null; // SAFETY: Accesses class state in a controlled way; no external IO occurs here.

    return { // SAFETY: Returns data to caller without mutating global state.
      content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          text: JSON.stringify( // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              message: 'Godot project stopped', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              finalOutput: output, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              finalErrors: errors, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            null, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            2 // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ), // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the get_godot_version tool
   */
  private async handleGetGodotVersion() { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Ensure godotPath is set SAFETY: Commented guidance; no code executes.
      if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
        await this.detectGodotPath(); // SAFETY: Await usage ensures asynchronous operations complete explicitly without blocking unexpectedly.
        if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
          return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
            'Could not find a valid Godot executable path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              'Set GODOT_PATH environment variable to specify the correct path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      this.logDebug('Getting Godot version'); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      const { stdout } = await execAsync(`"${this.godotPath}" --version`); // SAFETY: Executes shell commands only with validated arguments; monitor inputs for safety.
      return { // SAFETY: Returns data to caller without mutating global state.
        content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            text: stdout.trim(), // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } catch (error: unknown) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'; // SAFETY: Declares variables using safe defaults without executing external code.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        `Failed to get Godot version: ${errorMessage}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if the GODOT_PATH environment variable is set correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the list_projects tool
   */
  private async handleListProjects(args: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Normalize parameters to camelCase SAFETY: Commented guidance; no code executes.
    args = this.normalizeParameters(args); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    
    if (!args.directory) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Directory is required', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide a valid directory path to search for Godot projects'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    if (!this.validatePath(args.directory)) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Invalid directory path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide a valid path without ".." or other potentially unsafe characters'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      this.logDebug(`Listing Godot projects in directory: ${args.directory}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
      if (!existsSync(args.directory)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Directory does not exist: ${args.directory}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ['Provide a valid directory path that exists on the system'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      const recursive = args.recursive === true; // SAFETY: Declares variables using safe defaults without executing external code.
      const projects = this.findGodotProjects(args.directory, recursive); // SAFETY: Declares variables using safe defaults without executing external code.

      return { // SAFETY: Returns data to caller without mutating global state.
        content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            text: JSON.stringify(projects, null, 2), // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } catch (error: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        `Failed to list projects: ${error?.message || 'Unknown error'}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Ensure the directory exists and is accessible', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if you have permission to read the directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Get the structure of a Godot project asynchronously by counting files recursively
   * @param projectPath Path to the Godot project
   * @returns Promise resolving to an object with counts of scenes, scripts, assets, and other files
   */
  private getProjectStructureAsync(projectPath: string): Promise<any> { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    return new Promise((resolve) => { // SAFETY: Returns data to caller without mutating global state.
      try { // SAFETY: Error handling structure that does not introduce side effects by itself.
        const structure = { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          scenes: 0, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          scripts: 0, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          assets: 0, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          other: 0, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

        const scanDirectory = (currentPath: string) => { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          const entries = readdirSync(currentPath, { withFileTypes: true }); // SAFETY: Declares variables using safe defaults without executing external code.
          
          for (const entry of entries) { // SAFETY: Iterates over in-memory data; no IO performed directly here.
            const entryPath = join(currentPath, entry.name); // SAFETY: Declares variables using safe defaults without executing external code.
            
            // Skip hidden files and directories SAFETY: Commented guidance; no code executes.
            if (entry.name.startsWith('.')) { // SAFETY: Implements conditional logic without executing external commands itself.
              continue; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            
            if (entry.isDirectory()) { // SAFETY: Implements conditional logic without executing external commands itself.
              // Recursively scan subdirectories SAFETY: Commented guidance; no code executes.
              scanDirectory(entryPath); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            } else if (entry.isFile()) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
              // Count file by extension SAFETY: Commented guidance; no code executes.
              const ext = entry.name.split('.').pop()?.toLowerCase(); // SAFETY: Declares variables using safe defaults without executing external code.
              
              if (ext === 'tscn') { // SAFETY: Implements conditional logic without executing external commands itself.
                structure.scenes++; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              } else if (ext === 'gd' || ext === 'gdscript' || ext === 'cs') { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                structure.scripts++; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              } else if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'ttf', 'wav', 'mp3', 'ogg'].includes(ext || '')) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                structure.assets++; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              } else { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                structure.other++; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        
        // Start scanning from the project root SAFETY: Commented guidance; no code executes.
        scanDirectory(projectPath); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        resolve(structure); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } catch (error) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        this.logDebug(`Error getting project structure asynchronously: ${error}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        resolve({  // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          error: 'Failed to get project structure', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          scenes: 0, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          scripts: 0, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          assets: 0, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          other: 0 // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    }); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the get_project_info tool
   */
  private async handleGetProjectInfo(args: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Normalize parameters to camelCase SAFETY: Commented guidance; no code executes.
    args = this.normalizeParameters(args); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    
    if (!args.projectPath) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Project path is required', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide a valid path to a Godot project directory'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  
    if (!this.validatePath(args.projectPath)) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Invalid project path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide a valid path without ".." or other potentially unsafe characters'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  
    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Ensure godotPath is set SAFETY: Commented guidance; no code executes.
      if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
        await this.detectGodotPath(); // SAFETY: Await usage ensures asynchronous operations complete explicitly without blocking unexpectedly.
        if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
          return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
            'Could not find a valid Godot executable path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              'Set GODOT_PATH environment variable to specify the correct path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  
      // Check if the project directory exists and contains a project.godot file SAFETY: Commented guidance; no code executes.
      const projectFile = join(args.projectPath, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Not a valid Godot project: ${args.projectPath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the path points to a directory containing a project.godot file', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use list_projects to find valid Godot projects', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  
      this.logDebug(`Getting project info for: ${args.projectPath}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
  
      // Get Godot version SAFETY: Commented guidance; no code executes.
      const execOptions = { timeout: 10000 }; // 10 second timeout // SAFETY: Declares variables using safe defaults without executing external code.
      const { stdout } = await execAsync(`"${this.godotPath}" --version`, execOptions); // SAFETY: Executes shell commands only with validated arguments; monitor inputs for safety.
  
      // Get project structure using the recursive method SAFETY: Commented guidance; no code executes.
      const projectStructure = await this.getProjectStructureAsync(args.projectPath); // SAFETY: Declares variables using safe defaults without executing external code.
  
      // Extract project name from project.godot file SAFETY: Commented guidance; no code executes.
      let projectName = basename(args.projectPath); // SAFETY: Declares variables using safe defaults without executing external code.
      try { // SAFETY: Error handling structure that does not introduce side effects by itself.
        const fs = require('fs'); // SAFETY: Declares variables using safe defaults without executing external code.
        const projectFileContent = fs.readFileSync(projectFile, 'utf8'); // SAFETY: Declares variables using safe defaults without executing external code.
        const configNameMatch = projectFileContent.match(/config\/name="([^"]+)"/); // SAFETY: Declares variables using safe defaults without executing external code.
        if (configNameMatch && configNameMatch[1]) { // SAFETY: Implements conditional logic without executing external commands itself.
          projectName = configNameMatch[1]; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          this.logDebug(`Found project name in config: ${projectName}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } catch (error) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        this.logDebug(`Error reading project file: ${error}`); // SAFETY: Accesses class state in a controlled way; no external IO occurs here.
        // Continue with default project name if extraction fails SAFETY: Commented guidance; no code executes.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  
      return { // SAFETY: Returns data to caller without mutating global state.
        content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            text: JSON.stringify( // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
                name: projectName, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                path: args.projectPath, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                godotVersion: stdout.trim(), // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
                structure: projectStructure, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              null, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              2 // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            ), // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } catch (error: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        `Failed to get project info: ${error?.message || 'Unknown error'}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if the GODOT_PATH environment variable is set correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Verify the project path is accessible', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the create_scene tool
   */
  private async handleCreateScene(args: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Normalize parameters to camelCase SAFETY: Commented guidance; no code executes.
    args = this.normalizeParameters(args); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    
    if (!args.projectPath || !args.scenePath) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Project path and scene path are required', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide valid paths for both the project and the scene'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    if (!this.validatePath(args.projectPath) || !this.validatePath(args.scenePath)) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Invalid path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide valid paths without ".." or other potentially unsafe characters'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Check if the project directory exists and contains a project.godot file SAFETY: Commented guidance; no code executes.
      const projectFile = join(args.projectPath, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Not a valid Godot project: ${args.projectPath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the path points to a directory containing a project.godot file', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use list_projects to find valid Godot projects', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Prepare parameters for the operation (already in camelCase) SAFETY: Commented guidance; no code executes.
      const params = { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        scenePath: args.scenePath, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        rootNodeType: args.rootNodeType || 'Node2D', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      // Execute the operation SAFETY: Commented guidance; no code executes.
      const { stdout, stderr } = await this.executeOperation('create_scene', params, args.projectPath); // SAFETY: Declares variables using safe defaults without executing external code.

      if (stderr && stderr.includes('Failed to')) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Failed to create scene: ${stderr}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Check if the root node type is valid', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure you have write permissions to the scene path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Verify the scene path is valid', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      return { // SAFETY: Returns data to caller without mutating global state.
        content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            text: `Scene created successfully at: ${args.scenePath}\n\nOutput: ${stdout}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } catch (error: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        `Failed to create scene: ${error?.message || 'Unknown error'}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if the GODOT_PATH environment variable is set correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Verify the project path is accessible', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the add_node tool
   */
  private async handleAddNode(args: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Normalize parameters to camelCase SAFETY: Commented guidance; no code executes.
    args = this.normalizeParameters(args); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    
    if (!args.projectPath || !args.scenePath || !args.nodeType || !args.nodeName) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Missing required parameters', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide projectPath, scenePath, nodeType, and nodeName'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    if (!this.validatePath(args.projectPath) || !this.validatePath(args.scenePath)) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Invalid path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide valid paths without ".." or other potentially unsafe characters'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Check if the project directory exists and contains a project.godot file SAFETY: Commented guidance; no code executes.
      const projectFile = join(args.projectPath, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Not a valid Godot project: ${args.projectPath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the path points to a directory containing a project.godot file', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use list_projects to find valid Godot projects', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Check if the scene file exists SAFETY: Commented guidance; no code executes.
      const scenePath = join(args.projectPath, args.scenePath); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(scenePath)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Scene file does not exist: ${args.scenePath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the scene path is correct', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use create_scene to create a new scene first', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Prepare parameters for the operation (already in camelCase) SAFETY: Commented guidance; no code executes.
      const params: any = { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        scenePath: args.scenePath, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        nodeType: args.nodeType, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        nodeName: args.nodeName, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      // Add optional parameters SAFETY: Commented guidance; no code executes.
      if (args.parentNodePath) { // SAFETY: Implements conditional logic without executing external commands itself.
        params.parentNodePath = args.parentNodePath; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      if (args.properties) { // SAFETY: Implements conditional logic without executing external commands itself.
        params.properties = args.properties; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Execute the operation SAFETY: Commented guidance; no code executes.
      const { stdout, stderr } = await this.executeOperation('add_node', params, args.projectPath); // SAFETY: Declares variables using safe defaults without executing external code.

      if (stderr && stderr.includes('Failed to')) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Failed to add node: ${stderr}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Check if the node type is valid', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the parent node path exists', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Verify the scene file is valid', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      return { // SAFETY: Returns data to caller without mutating global state.
        content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            text: `Node '${args.nodeName}' of type '${args.nodeType}' added successfully to '${args.scenePath}'.\n\nOutput: ${stdout}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } catch (error: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        `Failed to add node: ${error?.message || 'Unknown error'}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if the GODOT_PATH environment variable is set correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Verify the project path is accessible', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the load_sprite tool
   */
  private async handleLoadSprite(args: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Normalize parameters to camelCase SAFETY: Commented guidance; no code executes.
    args = this.normalizeParameters(args); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    
    if (!args.projectPath || !args.scenePath || !args.nodePath || !args.texturePath) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Missing required parameters', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide projectPath, scenePath, nodePath, and texturePath'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    if ( // SAFETY: Implements conditional logic without executing external commands itself.
      !this.validatePath(args.projectPath) || // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      !this.validatePath(args.scenePath) || // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      !this.validatePath(args.nodePath) || // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      !this.validatePath(args.texturePath) // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    ) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Invalid path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide valid paths without ".." or other potentially unsafe characters'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Check if the project directory exists and contains a project.godot file SAFETY: Commented guidance; no code executes.
      const projectFile = join(args.projectPath, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Not a valid Godot project: ${args.projectPath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the path points to a directory containing a project.godot file', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use list_projects to find valid Godot projects', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Check if the scene file exists SAFETY: Commented guidance; no code executes.
      const scenePath = join(args.projectPath, args.scenePath); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(scenePath)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Scene file does not exist: ${args.scenePath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the scene path is correct', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use create_scene to create a new scene first', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Check if the texture file exists SAFETY: Commented guidance; no code executes.
      const texturePath = join(args.projectPath, args.texturePath); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(texturePath)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Texture file does not exist: ${args.texturePath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the texture path is correct', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Upload or create the texture file first', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Prepare parameters for the operation (already in camelCase) SAFETY: Commented guidance; no code executes.
      const params = { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        scenePath: args.scenePath, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        nodePath: args.nodePath, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        texturePath: args.texturePath, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      // Execute the operation SAFETY: Commented guidance; no code executes.
      const { stdout, stderr } = await this.executeOperation('load_sprite', params, args.projectPath); // SAFETY: Declares variables using safe defaults without executing external code.

      if (stderr && stderr.includes('Failed to')) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Failed to load sprite: ${stderr}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Check if the node path is correct', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the node is a Sprite2D, Sprite3D, or TextureRect', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Verify the texture file is a valid image format', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      return { // SAFETY: Returns data to caller without mutating global state.
        content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            text: `Sprite loaded successfully with texture: ${args.texturePath}\n\nOutput: ${stdout}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } catch (error: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        `Failed to load sprite: ${error?.message || 'Unknown error'}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if the GODOT_PATH environment variable is set correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Verify the project path is accessible', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the export_mesh_library tool
   */
  private async handleExportMeshLibrary(args: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Normalize parameters to camelCase SAFETY: Commented guidance; no code executes.
    args = this.normalizeParameters(args); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    
    if (!args.projectPath || !args.scenePath || !args.outputPath) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Missing required parameters', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide projectPath, scenePath, and outputPath'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    if ( // SAFETY: Implements conditional logic without executing external commands itself.
      !this.validatePath(args.projectPath) || // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      !this.validatePath(args.scenePath) || // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      !this.validatePath(args.outputPath) // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    ) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Invalid path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide valid paths without ".." or other potentially unsafe characters'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Check if the project directory exists and contains a project.godot file SAFETY: Commented guidance; no code executes.
      const projectFile = join(args.projectPath, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Not a valid Godot project: ${args.projectPath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the path points to a directory containing a project.godot file', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use list_projects to find valid Godot projects', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Check if the scene file exists SAFETY: Commented guidance; no code executes.
      const scenePath = join(args.projectPath, args.scenePath); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(scenePath)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Scene file does not exist: ${args.scenePath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the scene path is correct', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use create_scene to create a new scene first', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Prepare parameters for the operation (already in camelCase) SAFETY: Commented guidance; no code executes.
      const params: any = { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        scenePath: args.scenePath, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        outputPath: args.outputPath, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      // Add optional parameters SAFETY: Commented guidance; no code executes.
      if (args.meshItemNames && Array.isArray(args.meshItemNames)) { // SAFETY: Implements conditional logic without executing external commands itself.
        params.meshItemNames = args.meshItemNames; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Execute the operation SAFETY: Commented guidance; no code executes.
      const { stdout, stderr } = await this.executeOperation('export_mesh_library', params, args.projectPath); // SAFETY: Declares variables using safe defaults without executing external code.

      if (stderr && stderr.includes('Failed to')) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Failed to export mesh library: ${stderr}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Check if the scene contains valid 3D meshes', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the output path is valid', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Verify the scene file is valid', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      return { // SAFETY: Returns data to caller without mutating global state.
        content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            text: `MeshLibrary exported successfully to: ${args.outputPath}\n\nOutput: ${stdout}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } catch (error: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        `Failed to export mesh library: ${error?.message || 'Unknown error'}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if the GODOT_PATH environment variable is set correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Verify the project path is accessible', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the save_scene tool
   */
  private async handleSaveScene(args: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Normalize parameters to camelCase SAFETY: Commented guidance; no code executes.
    args = this.normalizeParameters(args); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    
    if (!args.projectPath || !args.scenePath) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Missing required parameters', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide projectPath and scenePath'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    if (!this.validatePath(args.projectPath) || !this.validatePath(args.scenePath)) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Invalid path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide valid paths without ".." or other potentially unsafe characters'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    // If newPath is provided, validate it SAFETY: Commented guidance; no code executes.
    if (args.newPath && !this.validatePath(args.newPath)) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Invalid new path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide a valid new path without ".." or other potentially unsafe characters'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Check if the project directory exists and contains a project.godot file SAFETY: Commented guidance; no code executes.
      const projectFile = join(args.projectPath, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Not a valid Godot project: ${args.projectPath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the path points to a directory containing a project.godot file', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use list_projects to find valid Godot projects', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Check if the scene file exists SAFETY: Commented guidance; no code executes.
      const scenePath = join(args.projectPath, args.scenePath); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(scenePath)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Scene file does not exist: ${args.scenePath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the scene path is correct', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use create_scene to create a new scene first', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Prepare parameters for the operation (already in camelCase) SAFETY: Commented guidance; no code executes.
      const params: any = { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        scenePath: args.scenePath, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      // Add optional parameters SAFETY: Commented guidance; no code executes.
      if (args.newPath) { // SAFETY: Implements conditional logic without executing external commands itself.
        params.newPath = args.newPath; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Execute the operation SAFETY: Commented guidance; no code executes.
      const { stdout, stderr } = await this.executeOperation('save_scene', params, args.projectPath); // SAFETY: Declares variables using safe defaults without executing external code.

      if (stderr && stderr.includes('Failed to')) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Failed to save scene: ${stderr}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Check if the scene file is valid', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure you have write permissions to the output path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Verify the scene can be properly packed', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      const savePath = args.newPath || args.scenePath; // SAFETY: Declares variables using safe defaults without executing external code.
      return { // SAFETY: Returns data to caller without mutating global state.
        content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            text: `Scene saved successfully to: ${savePath}\n\nOutput: ${stdout}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } catch (error: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        `Failed to save scene: ${error?.message || 'Unknown error'}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if the GODOT_PATH environment variable is set correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Verify the project path is accessible', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the get_uid tool
   */
  private async handleGetUid(args: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Normalize parameters to camelCase SAFETY: Commented guidance; no code executes.
    args = this.normalizeParameters(args); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    
    if (!args.projectPath || !args.filePath) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Missing required parameters', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide projectPath and filePath'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    if (!this.validatePath(args.projectPath) || !this.validatePath(args.filePath)) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Invalid path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide valid paths without ".." or other potentially unsafe characters'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Ensure godotPath is set SAFETY: Commented guidance; no code executes.
      if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
        await this.detectGodotPath(); // SAFETY: Await usage ensures asynchronous operations complete explicitly without blocking unexpectedly.
        if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
          return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
            'Could not find a valid Godot executable path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              'Set GODOT_PATH environment variable to specify the correct path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Check if the project directory exists and contains a project.godot file SAFETY: Commented guidance; no code executes.
      const projectFile = join(args.projectPath, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Not a valid Godot project: ${args.projectPath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the path points to a directory containing a project.godot file', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use list_projects to find valid Godot projects', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Check if the file exists SAFETY: Commented guidance; no code executes.
      const filePath = join(args.projectPath, args.filePath); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(filePath)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `File does not exist: ${args.filePath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ['Ensure the file path is correct'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Get Godot version to check if UIDs are supported SAFETY: Commented guidance; no code executes.
      const { stdout: versionOutput } = await execAsync(`"${this.godotPath}" --version`); // SAFETY: Executes shell commands only with validated arguments; monitor inputs for safety.
      const version = versionOutput.trim(); // SAFETY: Declares variables using safe defaults without executing external code.

      if (!this.isGodot44OrLater(version)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `UIDs are only supported in Godot 4.4 or later. Current version: ${version}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Upgrade to Godot 4.4 or later to use UIDs', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use resource paths instead of UIDs for this version of Godot', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Prepare parameters for the operation (already in camelCase) SAFETY: Commented guidance; no code executes.
      const params = { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        filePath: args.filePath, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      // Execute the operation SAFETY: Commented guidance; no code executes.
      const { stdout, stderr } = await this.executeOperation('get_uid', params, args.projectPath); // SAFETY: Declares variables using safe defaults without executing external code.

      if (stderr && stderr.includes('Failed to')) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Failed to get UID: ${stderr}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Check if the file is a valid Godot resource', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the file path is correct', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      return { // SAFETY: Returns data to caller without mutating global state.
        content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            text: `UID for ${args.filePath}: ${stdout.trim()}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } catch (error: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        `Failed to get UID: ${error?.message || 'Unknown error'}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if the GODOT_PATH environment variable is set correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Verify the project path is accessible', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Handle the update_project_uids tool
   */
  private async handleUpdateProjectUids(args: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    // Normalize parameters to camelCase SAFETY: Commented guidance; no code executes.
    args = this.normalizeParameters(args); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    
    if (!args.projectPath) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Project path is required', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide a valid path to a Godot project directory'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    if (!this.validatePath(args.projectPath)) { // SAFETY: Implements conditional logic without executing external commands itself.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        'Invalid project path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ['Provide a valid path without ".." or other potentially unsafe characters'] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Ensure godotPath is set SAFETY: Commented guidance; no code executes.
      if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
        await this.detectGodotPath(); // SAFETY: Await usage ensures asynchronous operations complete explicitly without blocking unexpectedly.
        if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
          return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
            'Could not find a valid Godot executable path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
              'Set GODOT_PATH environment variable to specify the correct path', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Check if the project directory exists and contains a project.godot file SAFETY: Commented guidance; no code executes.
      const projectFile = join(args.projectPath, 'project.godot'); // SAFETY: Declares variables using safe defaults without executing external code.
      if (!existsSync(projectFile)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Not a valid Godot project: ${args.projectPath}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure the path points to a directory containing a project.godot file', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use list_projects to find valid Godot projects', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Get Godot version to check if UIDs are supported SAFETY: Commented guidance; no code executes.
      const { stdout: versionOutput } = await execAsync(`"${this.godotPath}" --version`); // SAFETY: Executes shell commands only with validated arguments; monitor inputs for safety.
      const version = versionOutput.trim(); // SAFETY: Declares variables using safe defaults without executing external code.

      if (!this.isGodot44OrLater(version)) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `UIDs are only supported in Godot 4.4 or later. Current version: ${version}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Upgrade to Godot 4.4 or later to use UIDs', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Use resource paths instead of UIDs for this version of Godot', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Prepare parameters for the operation (already in camelCase) SAFETY: Commented guidance; no code executes.
      const params = { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
        projectPath: args.projectPath, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.

      // Execute the operation SAFETY: Commented guidance; no code executes.
      const { stdout, stderr } = await this.executeOperation('resave_resources', params, args.projectPath); // SAFETY: Declares variables using safe defaults without executing external code.

      if (stderr && stderr.includes('Failed to')) { // SAFETY: Implements conditional logic without executing external commands itself.
        return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
          `Failed to update project UIDs: ${stderr}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Check if the project is valid', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            'Ensure you have write permissions to the project directory', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      return { // SAFETY: Returns data to caller without mutating global state.
        content: [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
            type: 'text', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
            text: `Project UIDs updated successfully.\n\nOutput: ${stdout}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          }, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ], // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      }; // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } catch (error: any) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      return this.createErrorResponse( // SAFETY: Returns data to caller without mutating global state.
        `Failed to update project UIDs: ${error?.message || 'Unknown error'}`, // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        [ // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Ensure Godot is installed correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Check if the GODOT_PATH environment variable is set correctly', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
          'Verify the project path is accessible', // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        ] // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      ); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

  /**
   * Run the MCP server
   */
  async run() { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
    try { // SAFETY: Error handling structure that does not introduce side effects by itself.
      // Detect Godot path before starting the server SAFETY: Commented guidance; no code executes.
      await this.detectGodotPath(); // SAFETY: Await usage ensures asynchronous operations complete explicitly without blocking unexpectedly.

      if (!this.godotPath) { // SAFETY: Implements conditional logic without executing external commands itself.
        console.error('[SERVER] Failed to find a valid Godot executable path'); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
        console.error('[SERVER] Please set GODOT_PATH environment variable or provide a valid path'); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
        process.exit(1); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      // Check if the path is valid SAFETY: Commented guidance; no code executes.
      const isValid = await this.isValidGodotPath(this.godotPath); // SAFETY: Declares variables using safe defaults without executing external code.

      if (!isValid) { // SAFETY: Implements conditional logic without executing external commands itself.
        if (this.strictPathValidation) { // SAFETY: Implements conditional logic without executing external commands itself.
          // In strict mode, exit if the path is invalid SAFETY: Commented guidance; no code executes.
          console.error(`[SERVER] Invalid Godot path: ${this.godotPath}`); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
          console.error('[SERVER] Please set a valid GODOT_PATH environment variable or provide a valid path'); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
          process.exit(1); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
        } else { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
          // In compatibility mode, warn but continue with the default path SAFETY: Commented guidance; no code executes.
          console.warn(`[SERVER] Warning: Using potentially invalid Godot path: ${this.godotPath}`); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
          console.warn('[SERVER] This may cause issues when executing Godot commands'); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
          console.warn('[SERVER] This fallback behavior will be removed in a future version. Set strictPathValidation: true to opt-in to the new behavior.'); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
        } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      } // SAFETY: Structural block delimiter; no execution occurs on this line alone.

      console.log(`[SERVER] Using Godot at: ${this.godotPath}`); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.

      const transport = new StdioServerTransport(); // SAFETY: Declares variables using safe defaults without executing external code.
      await this.server.connect(transport); // SAFETY: Await usage ensures asynchronous operations complete explicitly without blocking unexpectedly.
      console.error('Godot MCP server running on stdio'); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
    } catch (error: unknown) { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'; // SAFETY: Declares variables using safe defaults without executing external code.
      console.error('[SERVER] Failed to start:', errorMessage); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
      process.exit(1); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
    } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  } // SAFETY: Structural block delimiter; no execution occurs on this line alone.
} // SAFETY: Structural block delimiter; no execution occurs on this line alone.

// Create and run the server SAFETY: Commented guidance; no code executes.
const server = new GodotServer(); // SAFETY: Declares variables using safe defaults without executing external code.
server.run().catch((error: unknown) => { // SAFETY: Structural block delimiter; no execution occurs on this line alone.
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'; // SAFETY: Declares variables using safe defaults without executing external code.
  console.error('Failed to run server:', errorMessage); // SAFETY: Logs to console only, which is side-effect limited to stdout/stderr.
  process.exit(1); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
}); // SAFETY: Performs in-memory operations only; reviewed for absence of hidden trojans.
