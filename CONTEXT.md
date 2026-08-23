# Learning Documentation

This context defines how the project preserves useful learning and maintenance knowledge as the code evolves.

## Language

**Future Maintainer**:
The project owner returning after the original implementation context has faded. The documentation's primary reader.
_Avoid_: General audience, beginner

**Operations Guide**:
Topic-oriented documentation describing how to run, configure, verify, and troubleshoot the current project.
_Avoid_: Wiki

**Evolution Record**:
A chronological account of a Learning Checkpoint and the reasons it matters for later maintenance. Factual errors may be corrected with an attributed revision note; changed interpretations require a later Learning Checkpoint.
_Avoid_: Changelog, release notes

**Learning Checkpoint**:
A deliberately selected code change, uniquely identified by its Git commit SHA, whose motivation, operational impact, or learning value warrants an Evolution Record. Ordinary commits are not Learning Checkpoints.
_Avoid_: Every commit, documentation commit

**Learning Motivation**:
A concise reason supplied by the author of a Learning Checkpoint that explains the question or maintenance need behind the change. Generated documentation must preserve it rather than infer intent from the diff.
_Avoid_: Inferred motivation, generated rationale

**Learning Outcome**:
A concise conclusion supplied by the author of a Learning Checkpoint and preserved as the authoritative statement of what the change taught. Generated documentation may explain or evidence it but must not invent it.
_Avoid_: Generated summary, inferred intent

**Current Guide**:
The maintained, topic-oriented instructions for operating and verifying the project's present state. It may be incrementally updated by a Documentation Pull Request.
_Avoid_: Generated manual, historical guide

**Documentation Pull Request**:
A reviewable change proposed by automation after a Learning Checkpoint, containing its Evolution Record and any minimal Current Guide updates.
_Avoid_: Auto-published docs, generated commit
