## Repository Operation Guidelines

1. Only `master` branch is considered stable.
2. Maintain a `master -> dev -> other-stuff` relationship.
3. Branches must have names clearly indicating how they are going to affect the project.
4. Branches must pass linting before merging.
5. Branches should always be squash-merged.
6. Merged branches should be "closed-off" and **never** re-used. Closing-off means:
    1. Tag the branch, `foo` for example, with tag name `merged__foo`.
    2. Don't forget step 1.
    3. Delete the branch.

## Attribute change flow:

- attribute on change
- try to convert attribute to property (ignore default values and range checks)
- update property with property setter
    - validate new property value and throw when needed
    - update internal models
    - silent update attribute with new property
- if throws
    - print error and revert attribute to the old value if one is available
- else
    - dispatch change event
    - if canceled
        - revert attribute to the old value if one is available
    - else
        - done!
