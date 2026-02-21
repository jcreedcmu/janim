Let's talk about real polynomial rings.

The elements of a polynomial ring are all the polynomials we can write
down over a particular set of variables, with real coefficients.

Let's think about what functions there are between these rings.
For example, what are some nice functions from R[x,y] to R[t]?

I'm being intentionally a bit vague about what "nice" means.

Let's say that being a nice function means at least that you map any constant to itself.

Let's also say that a nice function needs to be a ring homomorphism:
it respects all the ring operations.

In that case the only freedom we have left is deciding what x and y get mapped to.
Once we decide that, the function's value on everything else in R[x,y] follows from ring operation preservation.

So a nice function from R[x,y] to R[t] amounts to making only two choices:
choosing a polynomial in t for x, and another for y.

---

Notice that this is the same thing as describing a *parameterized curve in the plane*.
We're describing a polynomial function that says, for each time t, what the x and y values
should be at that time.

If we had instead asked about nice functions from R[x,y,z] to R[t], we would have
found that they are the same thing as polynomial curves in *3D* space.

---

So maps from R[x,y] to R[t] tell us how to map a one-dimensional line into
the two-dimensional plane, and maps from R[x,y,z] to R[t] tell us how to map a
line into 3D space.

It's a nice exercise to change the number of variables on both sides
of the function and see what happens.

For example, maps from R[x,y] to just R correspond to mere points in the plane.

Maps R[x,y,z] to R[t,u] correspond to two-dimensional polynomial surfaces in 3D space.

There's a general pattern happening here: algebraically nice maps from
a ring with n variables to a ring with p variables correspond to
geometrically nice maps going the other direction, from p-dimensional
space to n-dimensional space.

So it's very tempting to say that R[x,y] "is" a two dimensional
"space", and R[x,y,z] "is" a three-dimensional space... except
"backwards" or "upside down" in some sense, because the maps get
turned around when we try to reason about things fitting inside other
things.

This is a small tip of a deep iceberg: the duality between algebra and
geometry. It turns out that by seeing algebraic gadgets "upside down",
we can learn information about them that engages with geometric
intuitions. I hope to make a few more little videos exploring this,
stay tuned.
