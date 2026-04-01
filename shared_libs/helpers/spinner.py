import asyncio
import itertools
import sys

# async def spinner(message: str, stop_event: asyncio.Event):
#     for char in itertools.cycle("⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"):
#         if stop_event.is_set():
#             break
#         sys.stdout.write(f"\r{message} {char}")
#         sys.stdout.flush()
#         await asyncio.sleep(0.1)
#     sys.stdout.write("\r" + " " * 50 + "\r")

async def spinner(message: str, stop_event: asyncio.Event):
    spinner_chars = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    for char in itertools.cycle(spinner_chars):
        if stop_event.is_set():
            break
        # Ajout d'espaces pour nettoyer la ligne précédente
        sys.stdout.write(f"\r\033[1;34m{message} {char}\033[0m   \n")
        sys.stdout.flush()
        await asyncio.sleep(0.1)
    # Efface complètement la ligne à la fin
    sys.stdout.write("\r" + " " * (len(message) + 5) + "\r")
    sys.stdout.flush()