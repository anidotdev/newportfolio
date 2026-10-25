---
title: "Rebuilding OLS from the Objective Up"
description: "Understanding linear regression from scratch, deriving the error function, and finding the optimal slope and intercept using Ordinary Least Squares (OLS) and calculus."
pubDate: "2026-10-24"
draft: false
featured: true
tags:
  - linear algebra
  - machine learning
  - from scratch
updatedDate: "2026-10-25"
---

## Derivation

There are two common ways to find the values of \(m\) and \(b\): Ordinary Least Squares (OLS) and Gradient Descent. Scikit-learn uses the least-squares method in its `LinearRegression` class to find the best values of \(m\) and \(b\), while `SGDRegressor` uses Stochastic Gradient Descent. Let's build the mathematical intuition behind Linear Regression.

Suppose we have the following data about the hours of study by students and the marks they have obtained:

| Hours studied (\(x\)) | 1 | 2 | 3 | 4 | 5 | \(\ldots\) |
|:--|--:|--:|--:|--:|--:|--:|
| Marks (\(y\)) | 2 | 3 | 5 | 6 | 4 | \(\ldots\) |

Each row in this table is one observation, and we have a total of \(n\) observations. We will plot these observations on a graph with \(x\) on the horizontal axis and \(y\) on the vertical axis. Since the data follows a variable pattern, these points will not necessarily lie exactly on a straight line. That is what we want to do in Linear Regression: find the best possible line that comes as close as possible to all the points.

We all know that the equation of a straight line is:

$$
\boxed{\hat{y} = mx + b}
$$

Here, \(x\) is the input or independent variable, \(y\) is the actual observed output, and \(\hat{y}\) (read as *y-hat*) is the output predicted by our line. The value \(m\) is the slope of the line, and \(b\) is the y-intercept. In machine learning terminology, finding the values of \(m\) and \(b\) is part of training the model.

## Residual

Let's assume that we have drawn a straight line through the data points in the graph. For every data point, the line predicts a value \(\hat{y}_i\). Therefore, for the \(i\)-th observation,

$$
\boxed{\hat{y}_i = mx_i + b}
$$

Here, \(\hat{y}_i\) is the predicted value and \(y_i\) is the actual observed value. The difference between the actual and predicted values is called the **residual**:

$$
\boxed{d_i = y_i - \hat{y}_i}
$$

Substituting the equation of the line gives us:

$$
\boxed{d_i = y_i - mx_i - b}
$$

Let's take an example. Suppose an observation has \(x = 2\) and its actual value is \(y = 3\), and our current line is:

$$
\hat{y} = 1.5x + 0.5
$$

The predicted value for this observation will be:

$$
\hat{y} = 1.5(2) + 0.5 = 3.5
$$

But the actual value is \(3\), so the residual becomes:

$$
d = 3 - 3.5 = -0.5
$$

The negative sign tells us that our line predicted a value greater than the actual value. This is just one observation, though. What if we have thousands of observations? How do we measure how well our line performs across all these points? We need an error function for that.

## Error function

One way to calculate the total error is to add the absolute values of all the residuals:

$$
E = |d_1| + |d_2| + |d_3| + \cdots + |d_n|
$$

But there is a problem with using absolute values. The absolute-value function is not differentiable at zero, which makes it less convenient to minimize directly using standard derivative-based methods.

Instead, we can square each residual and add the results together. The squared-error function is differentiable, making it easier to find the minimum using calculus. Squaring also penalizes larger errors more heavily, so outliers can have a much greater impact on the total error.

Therefore, our error function becomes:

$$
E = d_1^2 + d_2^2 + d_3^2 + \cdots + d_n^2
$$

Using summation notation, we can write it as:

$$
\boxed{E = \sum_{i=1}^{n} d_i^2}
$$

Now, substituting the residual equation into this expression gives us:

$$
\boxed{E(m,b) = \sum_{i=1}^{n}(y_i - mx_i - b)^2}
$$

This is the **Sum of Squared Errors (SSE)**. Notice that our error function depends on \(m\) and \(b\). Different values of \(m\) and \(b\) give us different lines, each with a different total error. Our goal is to find the values of \(m\) and \(b\) that produce the minimum error.

## Finding \(m\) and \(b\)

Think of the error function as a surface where the two axes represent \(m\) and \(b\), and the height represents the error \(E\). Every point on this surface represents some combination of \(m\) and \(b\), and we want to find the lowest point on this surface.

For a differentiable function, the first derivatives are zero at an interior minimum. Since our error function depends on two variables, we take the partial derivatives with respect to both \(m\) and \(b\) and set them equal to zero:

$$
\boxed{\frac{\partial E}{\partial m} = 0
\qquad\text{and}\qquad
\frac{\partial E}{\partial b} = 0}
$$

### Finding \(b\)

We have:

$$
E(m,b) = \sum_{i=1}^{n}(y_i - mx_i - b)^2
$$

Taking the partial derivative with respect to \(b\) gives us:

$$
\frac{\partial E}{\partial b}
= -2\sum_{i=1}^{n}(y_i - mx_i - b) = 0
$$

Dividing both sides by \(-2\), we get:

$$
\sum_{i=1}^{n}(y_i - mx_i - b) = 0
$$

Expanding the summation gives us:

$$
\sum_{i=1}^{n} y_i
- m\sum_{i=1}^{n} x_i
- nb = 0
$$

Rearranging the terms gives:

$$
b = \frac{\sum_{i=1}^{n} y_i}{n}
- m\frac{\sum_{i=1}^{n} x_i}{n}
$$

The means of \(x\) and \(y\) are represented by \(\bar{x}\) and \(\bar{y}\), respectively. Therefore, we can write the equation as:

$$
\boxed{b = \bar{y} - m\bar{x}}
$$

And there is our first result. We can find the intercept if we know the slope and the means of \(x\) and \(y\).

### Finding \(m\)

We already know that:

$$
b = \bar{y} - m\bar{x}
$$

Substituting this value of \(b\) into our error function gives us:

$$
E(m) = \sum_{i=1}^{n}
\left[(y_i - \bar{y}) - m(x_i - \bar{x})\right]^2
$$

Now, we take the derivative with respect to \(m\) and set it equal to zero. Applying the chain rule gives us:

$$
\frac{dE}{dm}
= -2\sum_{i=1}^{n}(x_i - \bar{x})
\left[(y_i - \bar{y}) - m(x_i - \bar{x})\right]
= 0
$$

Dividing both sides by \(-2\) and expanding the expression gives us:

$$
\sum_{i=1}^{n}(x_i - \bar{x})(y_i - \bar{y})
- m\sum_{i=1}^{n}(x_i - \bar{x})^2
= 0
$$

Rearranging the terms, we get:

$$
m\sum_{i=1}^{n}(x_i - \bar{x})^2
= \sum_{i=1}^{n}(x_i - \bar{x})(y_i - \bar{y})
$$

Finally, dividing both sides by the sum of squared deviations of \(x\) gives us the slope:

$$
\boxed{
m = \frac{\sum_{i=1}^{n}(x_i - \bar{x})(y_i - \bar{y})}
{\sum_{i=1}^{n}(x_i - \bar{x})^2}
}
$$

And there we have it. We have derived the formula for the slope using OLS. Once we have both \(m\) and \(b\), we can plug them back into our original equation:

$$
\boxed{\hat{y} = mx + b}
$$

And this is how we find the best-fitting straight line using Ordinary Least Squares.
