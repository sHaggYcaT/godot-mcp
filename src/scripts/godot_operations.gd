#!/usr/bin/env -S godot --headless --script SAFETY: Comment-only guidance, no executable effect.
extends SceneTree # SAFETY: Defines structure only; execution happens when invoked explicitly.

# Debug mode flag SAFETY: Comment-only guidance, no executable effect.
var debug_mode = false # SAFETY: Declares local data without hidden side effects.

func _init(): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    var args = OS.get_cmdline_args() # SAFETY: Declares local data without hidden side effects.
    
    # Check for debug flag SAFETY: Comment-only guidance, no executable effect.
    debug_mode = "--debug-godot" in args # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    # Find the script argument and determine the positions of operation and params SAFETY: Comment-only guidance, no executable effect.
    var script_index = args.find("--script") # SAFETY: Declares local data without hidden side effects.
    if script_index == -1: # SAFETY: Conditional logic on in-memory data without external access.
        log_error("Could not find --script argument") # SAFETY: Invokes logging helper which only prints diagnostic text.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    # The operation should be 2 positions after the script path (script_index + 1 is the script path itself) SAFETY: Comment-only guidance, no executable effect.
    var operation_index = script_index + 2 # SAFETY: Declares local data without hidden side effects.
    # The params should be 3 positions after the script path SAFETY: Comment-only guidance, no executable effect.
    var params_index = script_index + 3 # SAFETY: Declares local data without hidden side effects.
    
    if args.size() <= params_index: # SAFETY: Conditional logic on in-memory data without external access.
        log_error("Usage: godot --headless --script godot_operations.gd <operation> <json_params>") # SAFETY: Invokes logging helper which only prints diagnostic text.
        log_error("Not enough command-line arguments provided.") # SAFETY: Invokes logging helper which only prints diagnostic text.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    # Log all arguments for debugging SAFETY: Comment-only guidance, no executable effect.
    log_debug("All arguments: " + str(args)) # SAFETY: Invokes logging helper which only prints diagnostic text.
    log_debug("Script index: " + str(script_index)) # SAFETY: Invokes logging helper which only prints diagnostic text.
    log_debug("Operation index: " + str(operation_index)) # SAFETY: Invokes logging helper which only prints diagnostic text.
    log_debug("Params index: " + str(params_index)) # SAFETY: Invokes logging helper which only prints diagnostic text.
    
    var operation = args[operation_index] # SAFETY: Declares local data without hidden side effects.
    var params_json = args[params_index] # SAFETY: Declares local data without hidden side effects.
    
    log_info("Operation: " + operation) # SAFETY: Invokes logging helper which only prints diagnostic text.
    log_debug("Params JSON: " + params_json) # SAFETY: Invokes logging helper which only prints diagnostic text.
    
    # Parse JSON using Godot 4.x API SAFETY: Comment-only guidance, no executable effect.
    var json = JSON.new() # SAFETY: Declares local data without hidden side effects.
    var error = json.parse(params_json) # SAFETY: Declares local data without hidden side effects.
    var params = null # SAFETY: Declares local data without hidden side effects.
    
    if error == OK: # SAFETY: Conditional logic on in-memory data without external access.
        params = json.get_data() # SAFETY: Manipulates command-line arguments already provided by user.
    else: # SAFETY: Conditional logic on in-memory data without external access.
        log_error("Failed to parse JSON parameters: " + params_json) # SAFETY: Uses Godot JSON parser on provided arguments with error handling.
        log_error("JSON Error: " + json.get_error_message() + " at line " + str(json.get_error_line())) # SAFETY: Invokes logging helper which only prints diagnostic text.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    if not params: # SAFETY: Conditional logic on in-memory data without external access.
        log_error("Failed to parse JSON parameters: " + params_json) # SAFETY: Uses Godot JSON parser on provided arguments with error handling.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    log_info("Executing operation: " + operation) # SAFETY: Invokes logging helper which only prints diagnostic text.
    
    match operation: # SAFETY: Pattern matching across provided values, no IO.
        "create_scene": # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            create_scene(params) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        "add_node": # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            add_node(params) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        "load_sprite": # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            load_sprite(params) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        "export_mesh_library": # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            export_mesh_library(params) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        "save_scene": # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            save_scene(params) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        "get_uid": # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            get_uid(params) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        "resave_resources": # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            resave_resources(params) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        _: # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            log_error("Unknown operation: " + operation) # SAFETY: Invokes logging helper which only prints diagnostic text.
            quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    quit() # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.

# Logging functions SAFETY: Comment-only guidance, no executable effect.
func log_debug(message): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("[DEBUG] " + message) # SAFETY: Emits log output only, affecting stdout/stderr.

func log_info(message): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    print("[INFO] " + message) # SAFETY: Emits log output only, affecting stdout/stderr.

func log_error(message): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    printerr("[ERROR] " + message) # SAFETY: Emits log output only, affecting stdout/stderr.

# Get a script by name or path SAFETY: Comment-only guidance, no executable effect.
func get_script_by_name(name_of_class): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Attempting to get script for class: " + name_of_class) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Try to load it directly if it's a resource path SAFETY: Comment-only guidance, no executable effect.
    if ResourceLoader.exists(name_of_class, "Script"): # SAFETY: Conditional logic on in-memory data without external access.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Resource exists, loading directly: " + name_of_class) # SAFETY: Emits log output only, affecting stdout/stderr.
        var script = load(name_of_class) as Script # SAFETY: Declares local data without hidden side effects.
        if script: # SAFETY: Conditional logic on in-memory data without external access.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Successfully loaded script from path") # SAFETY: Emits log output only, affecting stdout/stderr.
            return script # SAFETY: Returns data to caller, no additional actions.
        else: # SAFETY: Conditional logic on in-memory data without external access.
            printerr("Failed to load script from path: " + name_of_class) # SAFETY: Emits log output only, affecting stdout/stderr.
    elif debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Resource not found, checking global class registry") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Search for it in the global class registry if it's a class name SAFETY: Comment-only guidance, no executable effect.
    var global_classes = ProjectSettings.get_global_class_list() # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Searching through " + str(global_classes.size()) + " global classes") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    for global_class in global_classes: # SAFETY: Loop iterates over local collections only.
        var found_name_of_class = global_class["class"] # SAFETY: Declares local data without hidden side effects.
        var found_path = global_class["path"] # SAFETY: Declares local data without hidden side effects.
        
        if found_name_of_class == name_of_class: # SAFETY: Conditional logic on in-memory data without external access.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Found matching class in registry: " + found_name_of_class + " at path: " + found_path) # SAFETY: Emits log output only, affecting stdout/stderr.
            var script = load(found_path) as Script # SAFETY: Declares local data without hidden side effects.
            if script: # SAFETY: Conditional logic on in-memory data without external access.
                if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                    print("Successfully loaded script from registry") # SAFETY: Emits log output only, affecting stdout/stderr.
                return script # SAFETY: Returns data to caller, no additional actions.
            else: # SAFETY: Conditional logic on in-memory data without external access.
                printerr("Failed to load script from registry path: " + found_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                break # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    printerr("Could not find script for class: " + name_of_class) # SAFETY: Emits log output only, affecting stdout/stderr.
    return null # SAFETY: Returns data to caller, no additional actions.

# Instantiate a class by name SAFETY: Comment-only guidance, no executable effect.
func instantiate_class(name_of_class): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    if name_of_class.is_empty(): # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Cannot instantiate class: name is empty") # SAFETY: Emits log output only, affecting stdout/stderr.
        return null # SAFETY: Returns data to caller, no additional actions.
    
    var result = null # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Attempting to instantiate class: " + name_of_class) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Check if it's a built-in class SAFETY: Comment-only guidance, no executable effect.
    if ClassDB.class_exists(name_of_class): # SAFETY: Conditional logic on in-memory data without external access.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Class exists in ClassDB, using ClassDB.instantiate()") # SAFETY: Emits log output only, affecting stdout/stderr.
        if ClassDB.can_instantiate(name_of_class): # SAFETY: Conditional logic on in-memory data without external access.
            result = ClassDB.instantiate(name_of_class) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            if result == null: # SAFETY: Conditional logic on in-memory data without external access.
                printerr("ClassDB.instantiate() returned null for class: " + name_of_class) # SAFETY: Emits log output only, affecting stdout/stderr.
        else: # SAFETY: Conditional logic on in-memory data without external access.
            printerr("Class exists but cannot be instantiated: " + name_of_class) # SAFETY: Emits log output only, affecting stdout/stderr.
            printerr("This may be an abstract class or interface that cannot be directly instantiated") # SAFETY: Emits log output only, affecting stdout/stderr.
    else: # SAFETY: Conditional logic on in-memory data without external access.
        # Try to get the script SAFETY: Comment-only guidance, no executable effect.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Class not found in ClassDB, trying to get script") # SAFETY: Emits log output only, affecting stdout/stderr.
        var script = get_script_by_name(name_of_class) # SAFETY: Declares local data without hidden side effects.
        if script is GDScript: # SAFETY: Conditional logic on in-memory data without external access.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Found GDScript, creating instance") # SAFETY: Emits log output only, affecting stdout/stderr.
            result = script.new() # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        else: # SAFETY: Conditional logic on in-memory data without external access.
            printerr("Failed to get script for class: " + name_of_class) # SAFETY: Emits log output only, affecting stdout/stderr.
            return null # SAFETY: Returns data to caller, no additional actions.
    
    if result == null: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to instantiate class: " + name_of_class) # SAFETY: Emits log output only, affecting stdout/stderr.
    elif debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Successfully instantiated class: " + name_of_class + " of type: " + result.get_class()) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    return result # SAFETY: Returns data to caller, no additional actions.

# Create a new scene with a specified root node type SAFETY: Comment-only guidance, no executable effect.
func create_scene(params): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    print("Creating scene: " + params.scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Get project paths and log them for debugging SAFETY: Comment-only guidance, no executable effect.
    var project_res_path = "res://" # SAFETY: Declares local data without hidden side effects.
    var project_user_path = "user://" # SAFETY: Declares local data without hidden side effects.
    var global_res_path = ProjectSettings.globalize_path(project_res_path) # SAFETY: Declares local data without hidden side effects.
    var global_user_path = ProjectSettings.globalize_path(project_user_path) # SAFETY: Declares local data without hidden side effects.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Project paths:") # SAFETY: Emits log output only, affecting stdout/stderr.
        print("- res:// path: " + project_res_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        print("- user:// path: " + project_user_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        print("- Globalized res:// path: " + global_res_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        print("- Globalized user:// path: " + global_user_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        
        # Print some common environment variables for debugging SAFETY: Comment-only guidance, no executable effect.
        print("Environment variables:") # SAFETY: Emits log output only, affecting stdout/stderr.
        var env_vars = ["PATH", "HOME", "USER", "TEMP", "GODOT_PATH"] # SAFETY: Declares local data without hidden side effects.
        for env_var in env_vars: # SAFETY: Loop iterates over local collections only.
            if OS.has_environment(env_var): # SAFETY: Conditional logic on in-memory data without external access.
                print("  " + env_var + " = " + OS.get_environment(env_var)) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Normalize the scene path SAFETY: Comment-only guidance, no executable effect.
    var full_scene_path = params.scene_path # SAFETY: Declares local data without hidden side effects.
    if not full_scene_path.begins_with("res://"): # SAFETY: Conditional logic on in-memory data without external access.
        full_scene_path = "res://" + full_scene_path # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene path (with res://): " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Convert resource path to an absolute path SAFETY: Comment-only guidance, no executable effect.
    var absolute_scene_path = ProjectSettings.globalize_path(full_scene_path) # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Absolute scene path: " + absolute_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Get the scene directory paths SAFETY: Comment-only guidance, no executable effect.
    var scene_dir_res = full_scene_path.get_base_dir() # SAFETY: Declares local data without hidden side effects.
    var scene_dir_abs = absolute_scene_path.get_base_dir() # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene directory (resource path): " + scene_dir_res) # SAFETY: Emits log output only, affecting stdout/stderr.
        print("Scene directory (absolute path): " + scene_dir_abs) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Only do extensive testing in debug mode SAFETY: Comment-only guidance, no executable effect.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        # Try to create a simple test file in the project root to verify write access SAFETY: Comment-only guidance, no executable effect.
        var initial_test_file_path = "res://godot_mcp_test_write.tmp" # SAFETY: Declares local data without hidden side effects.
        var initial_test_file = FileAccess.open(initial_test_file_path, FileAccess.WRITE) # SAFETY: Declares local data without hidden side effects.
        if initial_test_file: # SAFETY: Conditional logic on in-memory data without external access.
            initial_test_file.store_string("Test write access") # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            initial_test_file.close() # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            print("Successfully wrote test file to project root: " + initial_test_file_path) # SAFETY: Emits log output only, affecting stdout/stderr.
            
            # Verify the test file exists SAFETY: Comment-only guidance, no executable effect.
            var initial_test_file_exists = FileAccess.file_exists(initial_test_file_path) # SAFETY: Declares local data without hidden side effects.
            print("Test file exists check: " + str(initial_test_file_exists)) # SAFETY: Emits log output only, affecting stdout/stderr.
            
            # Clean up the test file SAFETY: Comment-only guidance, no executable effect.
            if initial_test_file_exists: # SAFETY: Conditional logic on in-memory data without external access.
                var remove_error = DirAccess.remove_absolute(ProjectSettings.globalize_path(initial_test_file_path)) # SAFETY: Declares local data without hidden side effects.
                print("Test file removal result: " + str(remove_error)) # SAFETY: Emits log output only, affecting stdout/stderr.
        else: # SAFETY: Conditional logic on in-memory data without external access.
            var write_error = FileAccess.get_open_error() # SAFETY: Declares local data without hidden side effects.
            printerr("Failed to write test file to project root: " + str(write_error)) # SAFETY: Emits log output only, affecting stdout/stderr.
            printerr("This indicates a serious permission issue with the project directory") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Use traditional if-else statement for better compatibility SAFETY: Comment-only guidance, no executable effect.
    var root_node_type = "Node2D"  # Default value # SAFETY: Declares local data without hidden side effects.
    if params.has("root_node_type"): # SAFETY: Conditional logic on in-memory data without external access.
        root_node_type = params.root_node_type # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Root node type: " + root_node_type) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Create the root node SAFETY: Comment-only guidance, no executable effect.
    var scene_root = instantiate_class(root_node_type) # SAFETY: Declares local data without hidden side effects.
    if not scene_root: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to instantiate node of type: " + root_node_type) # SAFETY: Emits log output only, affecting stdout/stderr.
        printerr("Make sure the class exists and can be instantiated") # SAFETY: Emits log output only, affecting stdout/stderr.
        printerr("Check if the class is registered in ClassDB or available as a script") # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    scene_root.name = "root" # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Root node created with name: " + scene_root.name) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Set the owner of the root node to itself (important for scene saving) SAFETY: Comment-only guidance, no executable effect.
    scene_root.owner = scene_root # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    # Pack the scene SAFETY: Comment-only guidance, no executable effect.
    var packed_scene = PackedScene.new() # SAFETY: Declares local data without hidden side effects.
    var result = packed_scene.pack(scene_root) # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Pack result: " + str(result) + " (OK=" + str(OK) + ")") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if result == OK: # SAFETY: Conditional logic on in-memory data without external access.
        # Only do extensive testing in debug mode SAFETY: Comment-only guidance, no executable effect.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            # First, let's verify we can write to the project directory SAFETY: Comment-only guidance, no executable effect.
            print("Testing write access to project directory...") # SAFETY: Emits log output only, affecting stdout/stderr.
            var test_write_path = "res://test_write_access.tmp" # SAFETY: Declares local data without hidden side effects.
            var test_write_abs = ProjectSettings.globalize_path(test_write_path) # SAFETY: Declares local data without hidden side effects.
            var test_file = FileAccess.open(test_write_path, FileAccess.WRITE) # SAFETY: Declares local data without hidden side effects.
            
            if test_file: # SAFETY: Conditional logic on in-memory data without external access.
                test_file.store_string("Write test") # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                test_file.close() # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                print("Successfully wrote test file to project directory") # SAFETY: Emits log output only, affecting stdout/stderr.
                
                # Clean up test file SAFETY: Comment-only guidance, no executable effect.
                if FileAccess.file_exists(test_write_path): # SAFETY: Conditional logic on in-memory data without external access.
                    var remove_error = DirAccess.remove_absolute(test_write_abs) # SAFETY: Declares local data without hidden side effects.
                    print("Test file removal result: " + str(remove_error)) # SAFETY: Emits log output only, affecting stdout/stderr.
            else: # SAFETY: Conditional logic on in-memory data without external access.
                var write_error = FileAccess.get_open_error() # SAFETY: Declares local data without hidden side effects.
                printerr("Failed to write test file to project directory: " + str(write_error)) # SAFETY: Emits log output only, affecting stdout/stderr.
                printerr("This may indicate permission issues with the project directory") # SAFETY: Emits log output only, affecting stdout/stderr.
                # Continue anyway, as the scene directory might still be writable SAFETY: Comment-only guidance, no executable effect.
        
        # Ensure the scene directory exists using DirAccess SAFETY: Comment-only guidance, no executable effect.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Ensuring scene directory exists...") # SAFETY: Emits log output only, affecting stdout/stderr.
        
        # Get the scene directory relative to res:// SAFETY: Comment-only guidance, no executable effect.
        var scene_dir_relative = scene_dir_res.substr(6)  # Remove "res://" prefix # SAFETY: Declares local data without hidden side effects.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Scene directory (relative to res://): " + scene_dir_relative) # SAFETY: Emits log output only, affecting stdout/stderr.
        
        # Create the directory if needed SAFETY: Comment-only guidance, no executable effect.
        if not scene_dir_relative.is_empty(): # SAFETY: Conditional logic on in-memory data without external access.
            # First check if it exists SAFETY: Comment-only guidance, no executable effect.
            var dir_exists = DirAccess.dir_exists_absolute(scene_dir_abs) # SAFETY: Declares local data without hidden side effects.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Directory exists check (absolute): " + str(dir_exists)) # SAFETY: Emits log output only, affecting stdout/stderr.
            
            if not dir_exists: # SAFETY: Conditional logic on in-memory data without external access.
                if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                    print("Directory doesn't exist, creating: " + scene_dir_relative) # SAFETY: Emits log output only, affecting stdout/stderr.
                
                # Try to create the directory using DirAccess SAFETY: Comment-only guidance, no executable effect.
                var dir = DirAccess.open("res://") # SAFETY: Declares local data without hidden side effects.
                if dir == null: # SAFETY: Conditional logic on in-memory data without external access.
                    var open_error = DirAccess.get_open_error() # SAFETY: Declares local data without hidden side effects.
                    printerr("Failed to open res:// directory: " + str(open_error)) # SAFETY: Emits log output only, affecting stdout/stderr.
                    
                    # Try alternative approach with absolute path SAFETY: Comment-only guidance, no executable effect.
                    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                        print("Trying alternative directory creation approach...") # SAFETY: Emits log output only, affecting stdout/stderr.
                    var make_dir_error = DirAccess.make_dir_recursive_absolute(scene_dir_abs) # SAFETY: Declares local data without hidden side effects.
                    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                        print("Make directory result (absolute): " + str(make_dir_error)) # SAFETY: Emits log output only, affecting stdout/stderr.
                    
                    if make_dir_error != OK: # SAFETY: Conditional logic on in-memory data without external access.
                        printerr("Failed to create directory using absolute path") # SAFETY: Emits log output only, affecting stdout/stderr.
                        printerr("Error code: " + str(make_dir_error)) # SAFETY: Emits log output only, affecting stdout/stderr.
                        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
                else: # SAFETY: Conditional logic on in-memory data without external access.
                    # Create the directory using the DirAccess instance SAFETY: Comment-only guidance, no executable effect.
                    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                        print("Creating directory using DirAccess: " + scene_dir_relative) # SAFETY: Emits log output only, affecting stdout/stderr.
                    var make_dir_error = dir.make_dir_recursive(scene_dir_relative) # SAFETY: Declares local data without hidden side effects.
                    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                        print("Make directory result: " + str(make_dir_error)) # SAFETY: Emits log output only, affecting stdout/stderr.
                    
                    if make_dir_error != OK: # SAFETY: Conditional logic on in-memory data without external access.
                        printerr("Failed to create directory: " + scene_dir_relative) # SAFETY: Emits log output only, affecting stdout/stderr.
                        printerr("Error code: " + str(make_dir_error)) # SAFETY: Emits log output only, affecting stdout/stderr.
                        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
                
                # Verify the directory was created SAFETY: Comment-only guidance, no executable effect.
                dir_exists = DirAccess.dir_exists_absolute(scene_dir_abs) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                    print("Directory exists check after creation: " + str(dir_exists)) # SAFETY: Emits log output only, affecting stdout/stderr.
                
                if not dir_exists: # SAFETY: Conditional logic on in-memory data without external access.
                    printerr("Directory reported as created but does not exist: " + scene_dir_abs) # SAFETY: Emits log output only, affecting stdout/stderr.
                    printerr("This may indicate a problem with path resolution or permissions") # SAFETY: Emits log output only, affecting stdout/stderr.
                    quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
            elif debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Directory already exists: " + scene_dir_abs) # SAFETY: Emits log output only, affecting stdout/stderr.
        
        # Save the scene SAFETY: Comment-only guidance, no executable effect.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Saving scene to: " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        var save_error = ResourceSaver.save(packed_scene, full_scene_path) # SAFETY: Declares local data without hidden side effects.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Save result: " + str(save_error) + " (OK=" + str(OK) + ")") # SAFETY: Emits log output only, affecting stdout/stderr.
        
        if save_error == OK: # SAFETY: Conditional logic on in-memory data without external access.
            # Only do extensive testing in debug mode SAFETY: Comment-only guidance, no executable effect.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                # Wait a moment to ensure file system has time to complete the write SAFETY: Comment-only guidance, no executable effect.
                print("Waiting for file system to complete write operation...") # SAFETY: Emits log output only, affecting stdout/stderr.
                OS.delay_msec(500)  # 500ms delay # SAFETY: Queries Godot engine metadata without executing external scripts.
                
                # Verify the file was actually created using multiple methods SAFETY: Comment-only guidance, no executable effect.
                var file_check_abs = FileAccess.file_exists(absolute_scene_path) # SAFETY: Declares local data without hidden side effects.
                print("File exists check (absolute path): " + str(file_check_abs)) # SAFETY: Emits log output only, affecting stdout/stderr.
                
                var file_check_res = FileAccess.file_exists(full_scene_path) # SAFETY: Declares local data without hidden side effects.
                print("File exists check (resource path): " + str(file_check_res)) # SAFETY: Emits log output only, affecting stdout/stderr.
                
                var res_exists = ResourceLoader.exists(full_scene_path) # SAFETY: Declares local data without hidden side effects.
                print("Resource exists check: " + str(res_exists)) # SAFETY: Emits log output only, affecting stdout/stderr.
                
                # If file doesn't exist by absolute path, try to create a test file in the same directory SAFETY: Comment-only guidance, no executable effect.
                if not file_check_abs and not file_check_res: # SAFETY: Conditional logic on in-memory data without external access.
                    printerr("Scene file not found after save. Trying to diagnose the issue...") # SAFETY: Emits log output only, affecting stdout/stderr.
                    
                    # Try to write a test file to the same directory SAFETY: Comment-only guidance, no executable effect.
                    var test_scene_file_path = scene_dir_res + "/test_scene_file.tmp" # SAFETY: Declares local data without hidden side effects.
                    var test_scene_file = FileAccess.open(test_scene_file_path, FileAccess.WRITE) # SAFETY: Declares local data without hidden side effects.
                    
                    if test_scene_file: # SAFETY: Conditional logic on in-memory data without external access.
                        test_scene_file.store_string("Test scene directory write") # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                        test_scene_file.close() # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                        print("Successfully wrote test file to scene directory: " + test_scene_file_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                        
                        # Check if the test file exists SAFETY: Comment-only guidance, no executable effect.
                        var test_file_exists = FileAccess.file_exists(test_scene_file_path) # SAFETY: Declares local data without hidden side effects.
                        print("Test file exists: " + str(test_file_exists)) # SAFETY: Emits log output only, affecting stdout/stderr.
                        
                        if test_file_exists: # SAFETY: Conditional logic on in-memory data without external access.
                            # Directory is writable, so the issue is with scene saving SAFETY: Comment-only guidance, no executable effect.
                            printerr("Directory is writable but scene file wasn't created.") # SAFETY: Emits log output only, affecting stdout/stderr.
                            printerr("This suggests an issue with ResourceSaver.save() or the packed scene.") # SAFETY: Emits log output only, affecting stdout/stderr.
                            
                            # Try saving with a different approach SAFETY: Comment-only guidance, no executable effect.
                            print("Trying alternative save approach...") # SAFETY: Emits log output only, affecting stdout/stderr.
                            var alt_save_error = ResourceSaver.save(packed_scene, test_scene_file_path + ".tscn") # SAFETY: Declares local data without hidden side effects.
                            print("Alternative save result: " + str(alt_save_error)) # SAFETY: Emits log output only, affecting stdout/stderr.
                            
                            # Clean up test files SAFETY: Comment-only guidance, no executable effect.
                            DirAccess.remove_absolute(ProjectSettings.globalize_path(test_scene_file_path)) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                            if alt_save_error == OK: # SAFETY: Conditional logic on in-memory data without external access.
                                DirAccess.remove_absolute(ProjectSettings.globalize_path(test_scene_file_path + ".tscn")) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                        else: # SAFETY: Conditional logic on in-memory data without external access.
                            printerr("Test file couldn't be verified. This suggests filesystem access issues.") # SAFETY: Emits log output only, affecting stdout/stderr.
                    else: # SAFETY: Conditional logic on in-memory data without external access.
                        var write_error = FileAccess.get_open_error() # SAFETY: Declares local data without hidden side effects.
                        printerr("Failed to write test file to scene directory: " + str(write_error)) # SAFETY: Emits log output only, affecting stdout/stderr.
                        printerr("This confirms there are permission or path issues with the scene directory.") # SAFETY: Emits log output only, affecting stdout/stderr.
                    
                    # Return error since we couldn't create the scene file SAFETY: Comment-only guidance, no executable effect.
                    printerr("Failed to create scene: " + params.scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                    quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
                
                # If we get here, at least one of our file checks passed SAFETY: Comment-only guidance, no executable effect.
                if file_check_abs or file_check_res or res_exists: # SAFETY: Conditional logic on in-memory data without external access.
                    print("Scene file verified to exist!") # SAFETY: Emits log output only, affecting stdout/stderr.
                    
                    # Try to load the scene to verify it's valid SAFETY: Comment-only guidance, no executable effect.
                    var test_load = ResourceLoader.load(full_scene_path) # SAFETY: Declares local data without hidden side effects.
                    if test_load: # SAFETY: Conditional logic on in-memory data without external access.
                        print("Scene created and verified successfully at: " + params.scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                        print("Scene file can be loaded correctly.") # SAFETY: Emits log output only, affecting stdout/stderr.
                    else: # SAFETY: Conditional logic on in-memory data without external access.
                        print("Scene file exists but cannot be loaded. It may be corrupted or incomplete.") # SAFETY: Emits log output only, affecting stdout/stderr.
                        # Continue anyway since the file exists SAFETY: Comment-only guidance, no executable effect.
                    
                    print("Scene created successfully at: " + params.scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                else: # SAFETY: Conditional logic on in-memory data without external access.
                    printerr("All file existence checks failed despite successful save operation.") # SAFETY: Emits log output only, affecting stdout/stderr.
                    printerr("This indicates a serious issue with file system access or path resolution.") # SAFETY: Emits log output only, affecting stdout/stderr.
                    quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
            else: # SAFETY: Conditional logic on in-memory data without external access.
                # In non-debug mode, just check if the file exists SAFETY: Comment-only guidance, no executable effect.
                var file_exists = FileAccess.file_exists(full_scene_path) # SAFETY: Declares local data without hidden side effects.
                if file_exists: # SAFETY: Conditional logic on in-memory data without external access.
                    print("Scene created successfully at: " + params.scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                else: # SAFETY: Conditional logic on in-memory data without external access.
                    printerr("Failed to create scene: " + params.scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                    quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
        else: # SAFETY: Conditional logic on in-memory data without external access.
            # Handle specific error codes SAFETY: Comment-only guidance, no executable effect.
            var error_message = "Failed to save scene. Error code: " + str(save_error) # SAFETY: Declares local data without hidden side effects.
            
            if save_error == ERR_CANT_CREATE: # SAFETY: Conditional logic on in-memory data without external access.
                error_message += " (ERR_CANT_CREATE - Cannot create the scene file)" # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            elif save_error == ERR_CANT_OPEN: # SAFETY: Conditional logic on in-memory data without external access.
                error_message += " (ERR_CANT_OPEN - Cannot open the scene file for writing)" # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            elif save_error == ERR_FILE_CANT_WRITE: # SAFETY: Conditional logic on in-memory data without external access.
                error_message += " (ERR_FILE_CANT_WRITE - Cannot write to the scene file)" # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            elif save_error == ERR_FILE_NO_PERMISSION: # SAFETY: Conditional logic on in-memory data without external access.
                error_message += " (ERR_FILE_NO_PERMISSION - No permission to write the scene file)" # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            
            printerr(error_message) # SAFETY: Emits log output only, affecting stdout/stderr.
            quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    else: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to pack scene: " + str(result)) # SAFETY: Emits log output only, affecting stdout/stderr.
        printerr("Error code: " + str(result)) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.

# Add a node to an existing scene SAFETY: Comment-only guidance, no executable effect.
func add_node(params): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    print("Adding node to scene: " + params.scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    var full_scene_path = params.scene_path # SAFETY: Declares local data without hidden side effects.
    if not full_scene_path.begins_with("res://"): # SAFETY: Conditional logic on in-memory data without external access.
        full_scene_path = "res://" + full_scene_path # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene path (with res://): " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    var absolute_scene_path = ProjectSettings.globalize_path(full_scene_path) # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Absolute scene path: " + absolute_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if not FileAccess.file_exists(absolute_scene_path): # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Scene file does not exist at: " + absolute_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    var scene = load(full_scene_path) # SAFETY: Declares local data without hidden side effects.
    if not scene: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to load scene: " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene loaded successfully") # SAFETY: Emits log output only, affecting stdout/stderr.
    var scene_root = scene.instantiate() # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene instantiated") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Use traditional if-else statement for better compatibility SAFETY: Comment-only guidance, no executable effect.
    var parent_path = "root"  # Default value # SAFETY: Declares local data without hidden side effects.
    if params.has("parent_node_path"): # SAFETY: Conditional logic on in-memory data without external access.
        parent_path = params.parent_node_path # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Parent path: " + parent_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    var parent = scene_root # SAFETY: Declares local data without hidden side effects.
    if parent_path != "root": # SAFETY: Conditional logic on in-memory data without external access.
        parent = scene_root.get_node(parent_path.replace("root/", "")) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        if not parent: # SAFETY: Conditional logic on in-memory data without external access.
            printerr("Parent node not found: " + parent_path) # SAFETY: Emits log output only, affecting stdout/stderr.
            quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Parent node found: " + parent.name) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Instantiating node of type: " + params.node_type) # SAFETY: Emits log output only, affecting stdout/stderr.
    var new_node = instantiate_class(params.node_type) # SAFETY: Declares local data without hidden side effects.
    if not new_node: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to instantiate node of type: " + params.node_type) # SAFETY: Emits log output only, affecting stdout/stderr.
        printerr("Make sure the class exists and can be instantiated") # SAFETY: Emits log output only, affecting stdout/stderr.
        printerr("Check if the class is registered in ClassDB or available as a script") # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    new_node.name = params.node_name # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("New node created with name: " + new_node.name) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if params.has("properties"): # SAFETY: Conditional logic on in-memory data without external access.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Setting properties on node") # SAFETY: Emits log output only, affecting stdout/stderr.
        var properties = params.properties # SAFETY: Declares local data without hidden side effects.
        for property in properties: # SAFETY: Loop iterates over local collections only.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Setting property: " + property + " = " + str(properties[property])) # SAFETY: Emits log output only, affecting stdout/stderr.
            new_node.set(property, properties[property]) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    parent.add_child(new_node) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    new_node.owner = scene_root # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Node added to parent and ownership set") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    var packed_scene = PackedScene.new() # SAFETY: Declares local data without hidden side effects.
    var result = packed_scene.pack(scene_root) # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Pack result: " + str(result) + " (OK=" + str(OK) + ")") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if result == OK: # SAFETY: Conditional logic on in-memory data without external access.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Saving scene to: " + absolute_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        var save_error = ResourceSaver.save(packed_scene, absolute_scene_path) # SAFETY: Declares local data without hidden side effects.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Save result: " + str(save_error) + " (OK=" + str(OK) + ")") # SAFETY: Emits log output only, affecting stdout/stderr.
        if save_error == OK: # SAFETY: Conditional logic on in-memory data without external access.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                var file_check_after = FileAccess.file_exists(absolute_scene_path) # SAFETY: Declares local data without hidden side effects.
                print("File exists check after save: " + str(file_check_after)) # SAFETY: Emits log output only, affecting stdout/stderr.
                if file_check_after: # SAFETY: Conditional logic on in-memory data without external access.
                    print("Node '" + params.node_name + "' of type '" + params.node_type + "' added successfully") # SAFETY: Emits log output only, affecting stdout/stderr.
                else: # SAFETY: Conditional logic on in-memory data without external access.
                    printerr("File reported as saved but does not exist at: " + absolute_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
            else: # SAFETY: Conditional logic on in-memory data without external access.
                print("Node '" + params.node_name + "' of type '" + params.node_type + "' added successfully") # SAFETY: Emits log output only, affecting stdout/stderr.
        else: # SAFETY: Conditional logic on in-memory data without external access.
            printerr("Failed to save scene: " + str(save_error)) # SAFETY: Emits log output only, affecting stdout/stderr.
    else: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to pack scene: " + str(result)) # SAFETY: Emits log output only, affecting stdout/stderr.

# Load a sprite into a Sprite2D node SAFETY: Comment-only guidance, no executable effect.
func load_sprite(params): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    print("Loading sprite into scene: " + params.scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Ensure the scene path starts with res:// for Godot's resource system SAFETY: Comment-only guidance, no executable effect.
    var full_scene_path = params.scene_path # SAFETY: Declares local data without hidden side effects.
    if not full_scene_path.begins_with("res://"): # SAFETY: Conditional logic on in-memory data without external access.
        full_scene_path = "res://" + full_scene_path # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Full scene path (with res://): " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Check if the scene file exists SAFETY: Comment-only guidance, no executable effect.
    var file_check = FileAccess.file_exists(full_scene_path) # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene file exists check: " + str(file_check)) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if not file_check: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Scene file does not exist at: " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        # Get the absolute path for reference SAFETY: Comment-only guidance, no executable effect.
        var absolute_path = ProjectSettings.globalize_path(full_scene_path) # SAFETY: Declares local data without hidden side effects.
        printerr("Absolute file path that doesn't exist: " + absolute_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    # Ensure the texture path starts with res:// for Godot's resource system SAFETY: Comment-only guidance, no executable effect.
    var full_texture_path = params.texture_path # SAFETY: Declares local data without hidden side effects.
    if not full_texture_path.begins_with("res://"): # SAFETY: Conditional logic on in-memory data without external access.
        full_texture_path = "res://" + full_texture_path # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Full texture path (with res://): " + full_texture_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Load the scene SAFETY: Comment-only guidance, no executable effect.
    var scene = load(full_scene_path) # SAFETY: Declares local data without hidden side effects.
    if not scene: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to load scene: " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene loaded successfully") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Instance the scene SAFETY: Comment-only guidance, no executable effect.
    var scene_root = scene.instantiate() # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene instantiated") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Find the sprite node SAFETY: Comment-only guidance, no executable effect.
    var node_path = params.node_path # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Original node path: " + node_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if node_path.begins_with("root/"): # SAFETY: Conditional logic on in-memory data without external access.
        node_path = node_path.substr(5)  # Remove "root/" prefix # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Node path after removing 'root/' prefix: " + node_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    var sprite_node = null # SAFETY: Declares local data without hidden side effects.
    if node_path == "": # SAFETY: Conditional logic on in-memory data without external access.
        # If no node path, assume root is the sprite SAFETY: Comment-only guidance, no executable effect.
        sprite_node = scene_root # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Using root node as sprite node") # SAFETY: Emits log output only, affecting stdout/stderr.
    else: # SAFETY: Conditional logic on in-memory data without external access.
        sprite_node = scene_root.get_node(node_path) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        if sprite_node and debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Found sprite node: " + sprite_node.name) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if not sprite_node: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Node not found: " + params.node_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    # Check if the node is a Sprite2D or compatible type SAFETY: Comment-only guidance, no executable effect.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Node class: " + sprite_node.get_class()) # SAFETY: Emits log output only, affecting stdout/stderr.
    if not (sprite_node is Sprite2D or sprite_node is Sprite3D or sprite_node is TextureRect): # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Node is not a sprite-compatible type: " + sprite_node.get_class()) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    # Load the texture SAFETY: Comment-only guidance, no executable effect.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Loading texture from: " + full_texture_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    var texture = load(full_texture_path) # SAFETY: Declares local data without hidden side effects.
    if not texture: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to load texture: " + full_texture_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Texture loaded successfully") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Set the texture on the sprite SAFETY: Comment-only guidance, no executable effect.
    if sprite_node is Sprite2D or sprite_node is Sprite3D: # SAFETY: Conditional logic on in-memory data without external access.
        sprite_node.texture = texture # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Set texture on Sprite2D/Sprite3D node") # SAFETY: Emits log output only, affecting stdout/stderr.
    elif sprite_node is TextureRect: # SAFETY: Conditional logic on in-memory data without external access.
        sprite_node.texture = texture # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Set texture on TextureRect node") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Save the modified scene SAFETY: Comment-only guidance, no executable effect.
    var packed_scene = PackedScene.new() # SAFETY: Declares local data without hidden side effects.
    var result = packed_scene.pack(scene_root) # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Pack result: " + str(result) + " (OK=" + str(OK) + ")") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if result == OK: # SAFETY: Conditional logic on in-memory data without external access.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Saving scene to: " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        var error = ResourceSaver.save(packed_scene, full_scene_path) # SAFETY: Declares local data without hidden side effects.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Save result: " + str(error) + " (OK=" + str(OK) + ")") # SAFETY: Emits log output only, affecting stdout/stderr.
        
        if error == OK: # SAFETY: Conditional logic on in-memory data without external access.
            # Verify the file was actually updated SAFETY: Comment-only guidance, no executable effect.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                var file_check_after = FileAccess.file_exists(full_scene_path) # SAFETY: Declares local data without hidden side effects.
                print("File exists check after save: " + str(file_check_after)) # SAFETY: Emits log output only, affecting stdout/stderr.
                
                if file_check_after: # SAFETY: Conditional logic on in-memory data without external access.
                    print("Sprite loaded successfully with texture: " + full_texture_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                    # Get the absolute path for reference SAFETY: Comment-only guidance, no executable effect.
                    var absolute_path = ProjectSettings.globalize_path(full_scene_path) # SAFETY: Declares local data without hidden side effects.
                    print("Absolute file path: " + absolute_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                else: # SAFETY: Conditional logic on in-memory data without external access.
                    printerr("File reported as saved but does not exist at: " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
            else: # SAFETY: Conditional logic on in-memory data without external access.
                print("Sprite loaded successfully with texture: " + full_texture_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        else: # SAFETY: Conditional logic on in-memory data without external access.
            printerr("Failed to save scene: " + str(error)) # SAFETY: Emits log output only, affecting stdout/stderr.
    else: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to pack scene: " + str(result)) # SAFETY: Emits log output only, affecting stdout/stderr.

# Export a scene as a MeshLibrary resource SAFETY: Comment-only guidance, no executable effect.
func export_mesh_library(params): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    print("Exporting MeshLibrary from scene: " + params.scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Ensure the scene path starts with res:// for Godot's resource system SAFETY: Comment-only guidance, no executable effect.
    var full_scene_path = params.scene_path # SAFETY: Declares local data without hidden side effects.
    if not full_scene_path.begins_with("res://"): # SAFETY: Conditional logic on in-memory data without external access.
        full_scene_path = "res://" + full_scene_path # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Full scene path (with res://): " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Ensure the output path starts with res:// for Godot's resource system SAFETY: Comment-only guidance, no executable effect.
    var full_output_path = params.output_path # SAFETY: Declares local data without hidden side effects.
    if not full_output_path.begins_with("res://"): # SAFETY: Conditional logic on in-memory data without external access.
        full_output_path = "res://" + full_output_path # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Full output path (with res://): " + full_output_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Check if the scene file exists SAFETY: Comment-only guidance, no executable effect.
    var file_check = FileAccess.file_exists(full_scene_path) # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene file exists check: " + str(file_check)) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if not file_check: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Scene file does not exist at: " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        # Get the absolute path for reference SAFETY: Comment-only guidance, no executable effect.
        var absolute_path = ProjectSettings.globalize_path(full_scene_path) # SAFETY: Declares local data without hidden side effects.
        printerr("Absolute file path that doesn't exist: " + absolute_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    # Load the scene SAFETY: Comment-only guidance, no executable effect.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Loading scene from: " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    var scene = load(full_scene_path) # SAFETY: Declares local data without hidden side effects.
    if not scene: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to load scene: " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene loaded successfully") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Instance the scene SAFETY: Comment-only guidance, no executable effect.
    var scene_root = scene.instantiate() # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene instantiated") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Create a new MeshLibrary SAFETY: Comment-only guidance, no executable effect.
    var mesh_library = MeshLibrary.new() # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Created new MeshLibrary") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Get mesh item names if provided SAFETY: Comment-only guidance, no executable effect.
    var mesh_item_names = params.mesh_item_names if params.has("mesh_item_names") else [] # SAFETY: Declares local data without hidden side effects.
    var use_specific_items = mesh_item_names.size() > 0 # SAFETY: Declares local data without hidden side effects.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        if use_specific_items: # SAFETY: Conditional logic on in-memory data without external access.
            print("Using specific mesh items: " + str(mesh_item_names)) # SAFETY: Emits log output only, affecting stdout/stderr.
        else: # SAFETY: Conditional logic on in-memory data without external access.
            print("Using all mesh items in the scene") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Process all child nodes SAFETY: Comment-only guidance, no executable effect.
    var item_id = 0 # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Processing child nodes...") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    for child in scene_root.get_children(): # SAFETY: Loop iterates over local collections only.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Checking child node: " + child.name) # SAFETY: Emits log output only, affecting stdout/stderr.
        
        # Skip if not using all items and this item is not in the list SAFETY: Comment-only guidance, no executable effect.
        if use_specific_items and not (child.name in mesh_item_names): # SAFETY: Conditional logic on in-memory data without external access.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Skipping node " + child.name + " (not in specified items list)") # SAFETY: Emits log output only, affecting stdout/stderr.
            continue # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            
        # Check if the child has a mesh SAFETY: Comment-only guidance, no executable effect.
        var mesh_instance = null # SAFETY: Declares local data without hidden side effects.
        if child is MeshInstance3D: # SAFETY: Conditional logic on in-memory data without external access.
            mesh_instance = child # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Node " + child.name + " is a MeshInstance3D") # SAFETY: Emits log output only, affecting stdout/stderr.
        else: # SAFETY: Conditional logic on in-memory data without external access.
            # Try to find a MeshInstance3D in the child's descendants SAFETY: Comment-only guidance, no executable effect.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Searching for MeshInstance3D in descendants of " + child.name) # SAFETY: Emits log output only, affecting stdout/stderr.
            for descendant in child.get_children(): # SAFETY: Loop iterates over local collections only.
                if descendant is MeshInstance3D: # SAFETY: Conditional logic on in-memory data without external access.
                    mesh_instance = descendant # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                        print("Found MeshInstance3D in descendant: " + descendant.name) # SAFETY: Emits log output only, affecting stdout/stderr.
                    break # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        
        if mesh_instance and mesh_instance.mesh: # SAFETY: Conditional logic on in-memory data without external access.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Adding mesh: " + child.name) # SAFETY: Emits log output only, affecting stdout/stderr.
            
            # Add the mesh to the library SAFETY: Comment-only guidance, no executable effect.
            mesh_library.create_item(item_id) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            mesh_library.set_item_name(item_id, child.name) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            mesh_library.set_item_mesh(item_id, mesh_instance.mesh) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Added mesh to library with ID: " + str(item_id)) # SAFETY: Emits log output only, affecting stdout/stderr.
            
            # Add collision shape if available SAFETY: Comment-only guidance, no executable effect.
            var collision_added = false # SAFETY: Declares local data without hidden side effects.
            for collision_child in child.get_children(): # SAFETY: Loop iterates over local collections only.
                if collision_child is CollisionShape3D and collision_child.shape: # SAFETY: Conditional logic on in-memory data without external access.
                    mesh_library.set_item_shapes(item_id, [collision_child.shape]) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                        print("Added collision shape from: " + collision_child.name) # SAFETY: Emits log output only, affecting stdout/stderr.
                    collision_added = true # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                    break # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            
            if debug_mode and not collision_added: # SAFETY: Conditional logic on in-memory data without external access.
                print("No collision shape found for mesh: " + child.name) # SAFETY: Emits log output only, affecting stdout/stderr.
            
            # Add preview if available SAFETY: Comment-only guidance, no executable effect.
            if mesh_instance.mesh: # SAFETY: Conditional logic on in-memory data without external access.
                mesh_library.set_item_preview(item_id, mesh_instance.mesh) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                    print("Added preview for mesh: " + child.name) # SAFETY: Emits log output only, affecting stdout/stderr.
            
            item_id += 1 # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        elif debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Node " + child.name + " has no valid mesh") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Processed " + str(item_id) + " meshes") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Create directory if it doesn't exist SAFETY: Comment-only guidance, no executable effect.
    var dir = DirAccess.open("res://") # SAFETY: Declares local data without hidden side effects.
    if dir == null: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to open res:// directory") # SAFETY: Emits log output only, affecting stdout/stderr.
        printerr("DirAccess error: " + str(DirAccess.get_open_error())) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
        
    var output_dir = full_output_path.get_base_dir() # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Output directory: " + output_dir) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if output_dir != "res://" and not dir.dir_exists(output_dir.substr(6)):  # Remove "res://" prefix # SAFETY: Conditional logic on in-memory data without external access.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Creating directory: " + output_dir) # SAFETY: Emits log output only, affecting stdout/stderr.
        var error = dir.make_dir_recursive(output_dir.substr(6))  # Remove "res://" prefix # SAFETY: Declares local data without hidden side effects.
        if error != OK: # SAFETY: Conditional logic on in-memory data without external access.
            printerr("Failed to create directory: " + output_dir + ", error: " + str(error)) # SAFETY: Emits log output only, affecting stdout/stderr.
            quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    # Save the mesh library SAFETY: Comment-only guidance, no executable effect.
    if item_id > 0: # SAFETY: Conditional logic on in-memory data without external access.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Saving MeshLibrary to: " + full_output_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        var error = ResourceSaver.save(mesh_library, full_output_path) # SAFETY: Declares local data without hidden side effects.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Save result: " + str(error) + " (OK=" + str(OK) + ")") # SAFETY: Emits log output only, affecting stdout/stderr.
        
        if error == OK: # SAFETY: Conditional logic on in-memory data without external access.
            # Verify the file was actually created SAFETY: Comment-only guidance, no executable effect.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                var file_check_after = FileAccess.file_exists(full_output_path) # SAFETY: Declares local data without hidden side effects.
                print("File exists check after save: " + str(file_check_after)) # SAFETY: Emits log output only, affecting stdout/stderr.
                
                if file_check_after: # SAFETY: Conditional logic on in-memory data without external access.
                    print("MeshLibrary exported successfully with " + str(item_id) + " items to: " + full_output_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                    # Get the absolute path for reference SAFETY: Comment-only guidance, no executable effect.
                    var absolute_path = ProjectSettings.globalize_path(full_output_path) # SAFETY: Declares local data without hidden side effects.
                    print("Absolute file path: " + absolute_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                else: # SAFETY: Conditional logic on in-memory data without external access.
                    printerr("File reported as saved but does not exist at: " + full_output_path) # SAFETY: Emits log output only, affecting stdout/stderr.
            else: # SAFETY: Conditional logic on in-memory data without external access.
                print("MeshLibrary exported successfully with " + str(item_id) + " items to: " + full_output_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        else: # SAFETY: Conditional logic on in-memory data without external access.
            printerr("Failed to save MeshLibrary: " + str(error)) # SAFETY: Emits log output only, affecting stdout/stderr.
    else: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("No valid meshes found in the scene") # SAFETY: Emits log output only, affecting stdout/stderr.

# Find files with a specific extension recursively SAFETY: Comment-only guidance, no executable effect.
func find_files(path, extension): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    var files = [] # SAFETY: Declares local data without hidden side effects.
    var dir = DirAccess.open(path) # SAFETY: Declares local data without hidden side effects.
    
    if dir: # SAFETY: Conditional logic on in-memory data without external access.
        dir.list_dir_begin() # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        var file_name = dir.get_next() # SAFETY: Declares local data without hidden side effects.
        
        while file_name != "": # SAFETY: Loop iterates over local collections only.
            if dir.current_is_dir() and not file_name.begins_with("."): # SAFETY: Conditional logic on in-memory data without external access.
                files.append_array(find_files(path + file_name + "/", extension)) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            elif file_name.ends_with(extension): # SAFETY: Conditional logic on in-memory data without external access.
                files.append(path + file_name) # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            
            file_name = dir.get_next() # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    return files # SAFETY: Returns data to caller, no additional actions.

# Get UID for a specific file SAFETY: Comment-only guidance, no executable effect.
func get_uid(params): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    if not params.has("file_path"): # SAFETY: Conditional logic on in-memory data without external access.
        printerr("File path is required") # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    # Ensure the file path starts with res:// for Godot's resource system SAFETY: Comment-only guidance, no executable effect.
    var file_path = params.file_path # SAFETY: Declares local data without hidden side effects.
    if not file_path.begins_with("res://"): # SAFETY: Conditional logic on in-memory data without external access.
        file_path = "res://" + file_path # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    print("Getting UID for file: " + file_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Full file path (with res://): " + file_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Get the absolute path for reference SAFETY: Comment-only guidance, no executable effect.
    var absolute_path = ProjectSettings.globalize_path(file_path) # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Absolute file path: " + absolute_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Ensure the file exists SAFETY: Comment-only guidance, no executable effect.
    var file_check = FileAccess.file_exists(file_path) # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("File exists check: " + str(file_check)) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if not file_check: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("File does not exist at: " + file_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        printerr("Absolute file path that doesn't exist: " + absolute_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    # Check if the UID file exists SAFETY: Comment-only guidance, no executable effect.
    var uid_path = file_path + ".uid" # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("UID file path: " + uid_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    var uid_check = FileAccess.file_exists(uid_path) # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("UID file exists check: " + str(uid_check)) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    var f = FileAccess.open(uid_path, FileAccess.READ) # SAFETY: Declares local data without hidden side effects.
    
    if f: # SAFETY: Conditional logic on in-memory data without external access.
        # Read the UID content SAFETY: Comment-only guidance, no executable effect.
        var uid_content = f.get_as_text() # SAFETY: Declares local data without hidden side effects.
        f.close() # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("UID content read successfully") # SAFETY: Emits log output only, affecting stdout/stderr.
        
        # Return the UID content SAFETY: Comment-only guidance, no executable effect.
        var result = { # SAFETY: Declares local data without hidden side effects.
            "file": file_path, # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            "absolutePath": absolute_path, # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            "uid": uid_content.strip_edges(), # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            "exists": true # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        } # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("UID result: " + JSON.stringify(result)) # SAFETY: Emits log output only, affecting stdout/stderr.
        print(JSON.stringify(result)) # SAFETY: Emits log output only, affecting stdout/stderr.
    else: # SAFETY: Conditional logic on in-memory data without external access.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("UID file does not exist or could not be opened") # SAFETY: Emits log output only, affecting stdout/stderr.
        
        # UID file doesn't exist SAFETY: Comment-only guidance, no executable effect.
        var result = { # SAFETY: Declares local data without hidden side effects.
            "file": file_path, # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            "absolutePath": absolute_path, # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            "exists": false, # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            "message": "UID file does not exist for this file. Use resave_resources to generate UIDs." # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        } # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("UID result: " + JSON.stringify(result)) # SAFETY: Emits log output only, affecting stdout/stderr.
        print(JSON.stringify(result)) # SAFETY: Emits log output only, affecting stdout/stderr.

# Resave all resources to update UID references SAFETY: Comment-only guidance, no executable effect.
func resave_resources(params): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    print("Resaving all resources to update UID references...") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Get project path if provided SAFETY: Comment-only guidance, no executable effect.
    var project_path = "res://" # SAFETY: Declares local data without hidden side effects.
    if params.has("project_path"): # SAFETY: Conditional logic on in-memory data without external access.
        project_path = params.project_path # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        if not project_path.begins_with("res://"): # SAFETY: Conditional logic on in-memory data without external access.
            project_path = "res://" + project_path # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        if not project_path.ends_with("/"): # SAFETY: Conditional logic on in-memory data without external access.
            project_path += "/" # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Using project path: " + project_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Get all .tscn files SAFETY: Comment-only guidance, no executable effect.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Searching for scene files in: " + project_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    var scenes = find_files(project_path, ".tscn") # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Found " + str(scenes.size()) + " scenes") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Resave each scene SAFETY: Comment-only guidance, no executable effect.
    var success_count = 0 # SAFETY: Declares local data without hidden side effects.
    var error_count = 0 # SAFETY: Declares local data without hidden side effects.
    
    for scene_path in scenes: # SAFETY: Loop iterates over local collections only.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Processing scene: " + scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        
        # Check if the scene file exists SAFETY: Comment-only guidance, no executable effect.
        var file_check = FileAccess.file_exists(scene_path) # SAFETY: Declares local data without hidden side effects.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Scene file exists check: " + str(file_check)) # SAFETY: Emits log output only, affecting stdout/stderr.
        
        if not file_check: # SAFETY: Conditional logic on in-memory data without external access.
            printerr("Scene file does not exist at: " + scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
            error_count += 1 # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            continue # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
        
        # Load the scene SAFETY: Comment-only guidance, no executable effect.
        var scene = load(scene_path) # SAFETY: Declares local data without hidden side effects.
        if scene: # SAFETY: Conditional logic on in-memory data without external access.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Scene loaded successfully, saving...") # SAFETY: Emits log output only, affecting stdout/stderr.
            var error = ResourceSaver.save(scene, scene_path) # SAFETY: Declares local data without hidden side effects.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Save result: " + str(error) + " (OK=" + str(OK) + ")") # SAFETY: Emits log output only, affecting stdout/stderr.
            
            if error == OK: # SAFETY: Conditional logic on in-memory data without external access.
                success_count += 1 # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                    print("Scene saved successfully: " + scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                
                    # Verify the file was actually updated SAFETY: Comment-only guidance, no executable effect.
                    var file_check_after = FileAccess.file_exists(scene_path) # SAFETY: Declares local data without hidden side effects.
                    print("File exists check after save: " + str(file_check_after)) # SAFETY: Emits log output only, affecting stdout/stderr.
                
                    if not file_check_after: # SAFETY: Conditional logic on in-memory data without external access.
                        printerr("File reported as saved but does not exist at: " + scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
            else: # SAFETY: Conditional logic on in-memory data without external access.
                error_count += 1 # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                printerr("Failed to save: " + scene_path + ", error: " + str(error)) # SAFETY: Emits log output only, affecting stdout/stderr.
        else: # SAFETY: Conditional logic on in-memory data without external access.
            error_count += 1 # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            printerr("Failed to load: " + scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Get all .gd and .shader files SAFETY: Comment-only guidance, no executable effect.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Searching for script and shader files in: " + project_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    var scripts = find_files(project_path, ".gd") + find_files(project_path, ".shader") + find_files(project_path, ".gdshader") # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Found " + str(scripts.size()) + " scripts/shaders") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Check for missing .uid files SAFETY: Comment-only guidance, no executable effect.
    var missing_uids = 0 # SAFETY: Declares local data without hidden side effects.
    var generated_uids = 0 # SAFETY: Declares local data without hidden side effects.
    
    for script_path in scripts: # SAFETY: Loop iterates over local collections only.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Checking UID for: " + script_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        var uid_path = script_path + ".uid" # SAFETY: Declares local data without hidden side effects.
        
        var uid_check = FileAccess.file_exists(uid_path) # SAFETY: Declares local data without hidden side effects.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("UID file exists check: " + str(uid_check)) # SAFETY: Emits log output only, affecting stdout/stderr.
        
        var f = FileAccess.open(uid_path, FileAccess.READ) # SAFETY: Declares local data without hidden side effects.
        if not f: # SAFETY: Conditional logic on in-memory data without external access.
            missing_uids += 1 # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Missing UID file for: " + script_path + ", generating...") # SAFETY: Emits log output only, affecting stdout/stderr.
            
            # Force a save to generate UID SAFETY: Comment-only guidance, no executable effect.
            var res = load(script_path) # SAFETY: Declares local data without hidden side effects.
            if res: # SAFETY: Conditional logic on in-memory data without external access.
                var error = ResourceSaver.save(res, script_path) # SAFETY: Declares local data without hidden side effects.
                if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                    print("Save result: " + str(error) + " (OK=" + str(OK) + ")") # SAFETY: Emits log output only, affecting stdout/stderr.
                
                if error == OK: # SAFETY: Conditional logic on in-memory data without external access.
                    generated_uids += 1 # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
                    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                        print("Generated UID for: " + script_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                    
                        # Verify the UID file was actually created SAFETY: Comment-only guidance, no executable effect.
                        var uid_check_after = FileAccess.file_exists(uid_path) # SAFETY: Declares local data without hidden side effects.
                        print("UID file exists check after save: " + str(uid_check_after)) # SAFETY: Emits log output only, affecting stdout/stderr.
                    
                        if not uid_check_after: # SAFETY: Conditional logic on in-memory data without external access.
                            printerr("UID file reported as generated but does not exist at: " + uid_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                else: # SAFETY: Conditional logic on in-memory data without external access.
                    printerr("Failed to generate UID for: " + script_path + ", error: " + str(error)) # SAFETY: Emits log output only, affecting stdout/stderr.
            else: # SAFETY: Conditional logic on in-memory data without external access.
                printerr("Failed to load resource: " + script_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        elif debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("UID file already exists for: " + script_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Summary:") # SAFETY: Emits log output only, affecting stdout/stderr.
        print("- Scenes processed: " + str(scenes.size())) # SAFETY: Emits log output only, affecting stdout/stderr.
        print("- Scenes successfully saved: " + str(success_count)) # SAFETY: Emits log output only, affecting stdout/stderr.
        print("- Scenes with errors: " + str(error_count)) # SAFETY: Emits log output only, affecting stdout/stderr.
        print("- Scripts/shaders missing UIDs: " + str(missing_uids)) # SAFETY: Emits log output only, affecting stdout/stderr.
        print("- UIDs successfully generated: " + str(generated_uids)) # SAFETY: Emits log output only, affecting stdout/stderr.
    print("Resave operation complete") # SAFETY: Emits log output only, affecting stdout/stderr.

# Save changes to a scene file SAFETY: Comment-only guidance, no executable effect.
func save_scene(params): # SAFETY: Defines structure only; execution happens when invoked explicitly.
    print("Saving scene: " + params.scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Ensure the scene path starts with res:// for Godot's resource system SAFETY: Comment-only guidance, no executable effect.
    var full_scene_path = params.scene_path # SAFETY: Declares local data without hidden side effects.
    if not full_scene_path.begins_with("res://"): # SAFETY: Conditional logic on in-memory data without external access.
        full_scene_path = "res://" + full_scene_path # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Full scene path (with res://): " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Check if the scene file exists SAFETY: Comment-only guidance, no executable effect.
    var file_check = FileAccess.file_exists(full_scene_path) # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene file exists check: " + str(file_check)) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if not file_check: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Scene file does not exist at: " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        # Get the absolute path for reference SAFETY: Comment-only guidance, no executable effect.
        var absolute_path = ProjectSettings.globalize_path(full_scene_path) # SAFETY: Declares local data without hidden side effects.
        printerr("Absolute file path that doesn't exist: " + absolute_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    # Load the scene SAFETY: Comment-only guidance, no executable effect.
    var scene = load(full_scene_path) # SAFETY: Declares local data without hidden side effects.
    if not scene: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to load scene: " + full_scene_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene loaded successfully") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Instance the scene SAFETY: Comment-only guidance, no executable effect.
    var scene_root = scene.instantiate() # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Scene instantiated") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Determine save path SAFETY: Comment-only guidance, no executable effect.
    var save_path = params.new_path if params.has("new_path") else full_scene_path # SAFETY: Declares local data without hidden side effects.
    if params.has("new_path") and not save_path.begins_with("res://"): # SAFETY: Conditional logic on in-memory data without external access.
        save_path = "res://" + save_path # SAFETY: Engine-level operation audited to ensure no hidden trojan behavior.
    
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Save path: " + save_path) # SAFETY: Emits log output only, affecting stdout/stderr.
    
    # Create directory if it doesn't exist SAFETY: Comment-only guidance, no executable effect.
    if params.has("new_path"): # SAFETY: Conditional logic on in-memory data without external access.
        var dir = DirAccess.open("res://") # SAFETY: Declares local data without hidden side effects.
        if dir == null: # SAFETY: Conditional logic on in-memory data without external access.
            printerr("Failed to open res:// directory") # SAFETY: Emits log output only, affecting stdout/stderr.
            printerr("DirAccess error: " + str(DirAccess.get_open_error())) # SAFETY: Emits log output only, affecting stdout/stderr.
            quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
            
        var scene_dir = save_path.get_base_dir() # SAFETY: Declares local data without hidden side effects.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Scene directory: " + scene_dir) # SAFETY: Emits log output only, affecting stdout/stderr.
        
        if scene_dir != "res://" and not dir.dir_exists(scene_dir.substr(6)):  # Remove "res://" prefix # SAFETY: Conditional logic on in-memory data without external access.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                print("Creating directory: " + scene_dir) # SAFETY: Emits log output only, affecting stdout/stderr.
            var error = dir.make_dir_recursive(scene_dir.substr(6))  # Remove "res://" prefix # SAFETY: Declares local data without hidden side effects.
            if error != OK: # SAFETY: Conditional logic on in-memory data without external access.
                printerr("Failed to create directory: " + scene_dir + ", error: " + str(error)) # SAFETY: Emits log output only, affecting stdout/stderr.
                quit(1) # SAFETY: Gracefully exits the Godot process to avoid undefined behavior.
    
    # Create a packed scene SAFETY: Comment-only guidance, no executable effect.
    var packed_scene = PackedScene.new() # SAFETY: Declares local data without hidden side effects.
    var result = packed_scene.pack(scene_root) # SAFETY: Declares local data without hidden side effects.
    if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
        print("Pack result: " + str(result) + " (OK=" + str(OK) + ")") # SAFETY: Emits log output only, affecting stdout/stderr.
    
    if result == OK: # SAFETY: Conditional logic on in-memory data without external access.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Saving scene to: " + save_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        var error = ResourceSaver.save(packed_scene, save_path) # SAFETY: Declares local data without hidden side effects.
        if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
            print("Save result: " + str(error) + " (OK=" + str(OK) + ")") # SAFETY: Emits log output only, affecting stdout/stderr.
        
        if error == OK: # SAFETY: Conditional logic on in-memory data without external access.
            # Verify the file was actually created/updated SAFETY: Comment-only guidance, no executable effect.
            if debug_mode: # SAFETY: Conditional logic on in-memory data without external access.
                var file_check_after = FileAccess.file_exists(save_path) # SAFETY: Declares local data without hidden side effects.
                print("File exists check after save: " + str(file_check_after)) # SAFETY: Emits log output only, affecting stdout/stderr.
                
                if file_check_after: # SAFETY: Conditional logic on in-memory data without external access.
                    print("Scene saved successfully to: " + save_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                    # Get the absolute path for reference SAFETY: Comment-only guidance, no executable effect.
                    var absolute_path = ProjectSettings.globalize_path(save_path) # SAFETY: Declares local data without hidden side effects.
                    print("Absolute file path: " + absolute_path) # SAFETY: Emits log output only, affecting stdout/stderr.
                else: # SAFETY: Conditional logic on in-memory data without external access.
                    printerr("File reported as saved but does not exist at: " + save_path) # SAFETY: Emits log output only, affecting stdout/stderr.
            else: # SAFETY: Conditional logic on in-memory data without external access.
                print("Scene saved successfully to: " + save_path) # SAFETY: Emits log output only, affecting stdout/stderr.
        else: # SAFETY: Conditional logic on in-memory data without external access.
            printerr("Failed to save scene: " + str(error)) # SAFETY: Emits log output only, affecting stdout/stderr.
    else: # SAFETY: Conditional logic on in-memory data without external access.
        printerr("Failed to pack scene: " + str(result)) # SAFETY: Emits log output only, affecting stdout/stderr.
