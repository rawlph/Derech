How to add a start and exit portal:
Make an eixt portal in your game they can walk/fly/drive into, you can add a label like Vibeverse Portal. This way players can play and go to the next game like a metaverse webring! Your game will be added if you have a portal.

And if they enter the portal it should redirect the page here:

http://portal.pieter.com

You can send GET query params (like ?username=bla&color=red&speed=0.2&ref=bla.com) that get forwarded like:
- username= (username/name of player)
- color= (color of player in hex or just red/green/yellow)
- speed= (meters per second)
- ref= (url of which game you come from)

You can use the ?ref= param to add a portal BACK to the game they came from

The URL would look like portal.pieter .com/?username=levelsio&color=red&speed=5&ref=fly.pieter. com

Then the game you portal too can use that information to put the player in the new game with full continuity!

If you want also:
-avatar_url=
- team=
-speed_x=  (meters per second)
-speed_y= (meters per second)
-speed_z= (meters per second)
-rotation_x=
-rotation_y=
-rotation_z=

The portal redirector will always add ?portal=true so you can use that to figure out if user comes from a portal and instantly put them in your game coming out of another portal without any start screens

Add a start portal:
(!) IMPORTANT: when receiving a user (with ?portal=true in your URL) and ?ref= make a portal where the user spawns out of and they can return back to the previous game if they go back into that portal. When returning them make sure to send all the ?query parameters again too

IMPORTANT: make sure your game instantly loads (no loading screens, no input screens) so the continuity is nice for players

SAMPLE CODE: for ThreeJS here's my sample code to make a start and exit portal:
https://gist.github.com/levelsio/ffdbfe356b421b97a31664ded4bc961d