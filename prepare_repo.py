import os
import subprocess
import sys

def run_command(command, description):
    print(f"--- {description} ---")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr}")
        return False

def check_leaks():
    print("--- Checking for potential secret leaks ---")
    # Common secret patterns
    patterns = [
        r'sk-[a-zA-Z0-9]{32}',       # OpenAI
        r'AIza[a-zA-Z0-9\\-_]{35}',  # Google
        r'sb_p[a-zA-Z0-9]{32}',      # Supabase strings (approx)
        r'apify_api_[a-zA-Z0-9]{32}', # Apify
    ]
    
    leaks_found = False
    for pattern in patterns:
        # Search while ignoring .git and files in .gitignore
        cmd = f"grep -rE \"{pattern}\" . --exclude-dir=.git"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.stdout:
            print(f"Potential leak found with pattern {pattern}:")
            # Filter matches to only show files NOT ignored by git
            matches = result.stdout.strip().split('\n')
            for match in matches:
                file_path = match.split(':')[0]
                # Check if file is tracked by git
                git_check = subprocess.run(f"git check-ignore {file_path}", shell=True, capture_output=True)
                if git_check.returncode != 0: # 0 means ignored, we want NOT ignored
                    print(f"  CRITICAL: {match}")
                    leaks_found = True
                else:
                    print(f"  (Ignored): {match}")
    
    if not leaks_found:
        print("No critical leaks found in non-ignored files.")
    return not leaks_found

def main():
    # 1. Sync extension env
    if os.path.exists("sync_env.py"):
        run_command("python sync_env.py", "Syncing extension environment variables")
    
    # 2. Check for leaks
    safe = check_leaks()
    
    if not safe:
        print("\nWARNING: Secrets detected in tracked files. Fix these before pushing!")
        return

    print("\nRepo is prepared. You can now commit and push securely.")
    print("Commands to run:")
    print("  git add .")
    print("  git commit -m \"Your message\"")
    print("  git push")

if __name__ == "__main__":
    main()
