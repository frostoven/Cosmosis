Conventions in the directory:

Classes starting with Z act like normal classes, except that they're basically
wrappers. Whereas other classes in this directory will set up a new instance of
something (eg. AreaLight will instantiate a new RectAreaLight and place that at
the parent's location), Z-functions will instead skip instantiation, and treat
the parent as though it is a newly instantiated item and do initialisation of
defaults appropriate for this engine on that parent.
