import subprocess
import shutil
import os

def git_clean_pycache(folder_to_delete):
    print(f"🔍 Searching for {folder_to_delete} directories...")

    pycache_dirs = []

    for root, dirs, _ in os.walk("."):
        if f"{folder_to_delete}" in dirs:
            pycache_dirs.append(os.path.join(root, f"{folder_to_delete}"))

    if not pycache_dirs:
        print(f"✅ No {folder_to_delete} found")
        return

    print(f"🗑 Found {len(pycache_dirs)} {folder_to_delete} directories")

    for path in pycache_dirs:
        subprocess.run(["git", "rm", "-r", "--cached", "--ignore-unmatch", path],check=False)

    print(f"✅ All {folder_to_delete} removed from git index")

    for path in pycache_dirs:
        shutil.rmtree(path, ignore_errors=True)

    print(f"🧹 {folder_to_delete} directories deleted from filesystem")


if __name__ == "__main__":
    git_clean_pycache("__pycache__")
    git_clean_pycache("web")



# find . -type d -name "__pycache__" -print -exec git rm -r --cached --ignore-unmatch {} +
# find . -type d -name "__pycache__" -prune -exec rm -rf {} +

# git commit -m "chore: remove  and web from git"
# git commit -m "chore: remove all __pycache__ and web directories from git"

# git commit -m "chore: remove all __pycache__ and web directories"
# git clean-pycache
