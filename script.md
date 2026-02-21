# Seeing Upside-Down: a brief taste of algebraic geometry
## (Episode 1)

Total duration: 70s

---

### Scene 1: Title (0–3s)

**Seeing Upside-Down**
*a brief taste of algebraic geometry*
(Episode 1)

---

### Scene 2: Polynomial Rings (3–10s)

Show: R[t], R[x,y], R[u,v,w], ...
with example polynomials underneath each.

VO: Let's talk about real polynomial rings. The elements of one of these rings
are all the polynomials we can write down over a particular set of variables,
with real coefficients.

---

### Scene 3: Homomorphism (10–30s)

Show: f : R[x,y] -> R[t]

Then show f(0)=0, f(-3)=-3, f(100/7)=100/7.

Then cycle through mapping examples with persistent prefixes f(x) = ..., f(y) = ...:
- f(x) = t^3 + 1, f(y) = t^2 - t
- f(x) = t, f(y) = t^5 - t^4 + t^3 - t^2 + 3
- f(x) = 2t - 1, f(y) = t^2
- f(x) = 0, f(y) = t

VO: What are the nice functions between these rings? Let's consider an example.
What are some nice functions from R[x,y] to R[t]? Let's say that we want to only
map constants to themselves. If we demand that f is a ring homomorphism,
then the only freedom we have left is deciding what x and y get mapped to.
A nice function from R[x,y] to R[t] amounts to making only two choices:
choosing a polynomial in t for x, and another for y.

---

### Scene 4: Parametric Curves in 2D (30–40s)

Left side: same f(x) = ..., f(y) = ... cycling formulas.
Right side: 2D plot showing the corresponding parametric curve.

VO: This is the same thing as describing a parameterized curve in the plane.
We're giving for each time t a function that tells us what the x and y values
should be.

---

### Scene 5: Parametric Curves in 3D (40–50s)

Left side: f(x) = ..., f(y) = ..., f(z) = ... cycling formulas.
Right side: rotating 3D plot showing the corresponding space curve.

VO: If we had asked about nice functions from R[x,y,z] to R[t], we would have
found that they are parameterized curves in 3D space.

---

### Scene 6: Duality / Conclusion (50–70s)

Progressive table (rows aligned on the double arrow), appearing at 0s, 5s, 13s:

    R[x,y] -> R[t]       <-->   polynomial curves in R^2
    R[x,y,z] -> R[t]     <-->   polynomial curves in R^3
    R[x_1,...,x_n] -> R[t_1,...,t_p]  <-->  polynomial maps R^p -> R^n

The general row has bezier arrows linking the two n's and two p's.
Table fades out at 17s, replaced by closing:

    algebra  <-->  geometry

VO: So maps from R[x,y] to R[t] tell us how to map a one-dimensional line into
the two-dimensional plane, and maps from R[x,y,z] to R[t] tell us how to map a
line into 3D space. We're tempted to conclude that a polynomial ring with n
variables has something to do with n-dimensional space, but the functions seem
turned around backwards. This pattern does work out nicely in general.
Algebraically nice maps from a ring with n variables to a ring with p variables
correspond to geometrically nice maps going the other direction, from
p-dimensional space to n-dimensional space. This is a small tip of a deep
iceberg: the duality between algebra and geometry.
