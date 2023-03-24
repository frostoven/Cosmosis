### Important
Be careful with these components; they're not traditional. They're meant for
cases you want to update them 120+ times per second without blowing up your RAM
from excessive setState calls and garbage collection issues.

### How they work 
For rapid external changes, refs are used to directly set their values as this
is a fairly lightweight way of dealing with rapid change. When the user however
is the one modifying their values, setState is used as per normal.
