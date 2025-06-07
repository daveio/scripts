#!/usr/bin/env python

from app import app  # noqa: F401

if __name__ == "__main__":
    app.run(host="::", port=5001, debug=True)
