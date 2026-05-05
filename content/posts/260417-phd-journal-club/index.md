---
title: "Assessing the replicability of RCTs in RWE emulations (Journal Club)"
date: 2026-04-17
url: "/posts/phd_journal_club/"
company: "Mahidol University, Thailand"
math: true
---

I recently hosted a journal club discussion covering the paper "Assessing the replicability of RCTs in RWE emulations". The presentation was based on the paper by Jeanette Köppe, Charlotte Micheloud, Stella Erdmann, Rachel Heyard and Leonhard Held, published in BMC Medical Research Methodology (2025). The resources for the Journal Club can be found [here](https://www.rama.mahidol.ac.th/ceb/news/15apr2026-1135). 

<!--more-->

### The Efficacy-Effectiveness Gap
While RCTs are the gold standard for internal validity, they often lack external validity because they exclude vulnerable or complex populations, such as multi-morbid or pregnant patients. RWE emulations bridge this gap by analyzing routine healthcare data. However, traditional metrics like the **Two-Trials Rule** ($p_{TTR} = \max(p_{RCT}, p_{RWE}) \le \alpha$) are sample-size blind and do not account for the structural differences between controlled trials and observational routine care.

### The Sceptical P-Value ($p_s$)
As outlined in the presentation, a more rigorous criterion for success is the **Sceptical P-Value**. This framework tests the joint credibility of both studies by adopting the perspective of a rational sceptic:

*   **Matthews' Analysis of Credibility**: This determines the most extreme prior disbelief ($\tau^2$) the RCT result can survive. A strong RCT forces the sceptic into a narrower prior: $$\tau^2 = \sigma_{RCT}^2 \times \left(\frac{z_{\alpha}}{|z_{RCT}|}\right)^2$$
*   **Box's Prior-Data Conflict Test**: This evaluates if the RWE data significantly conflicts with the sceptic’s prior: $$t_{Box} = \frac{\theta_{RWE}}{\sqrt{\tau^2 + \sigma_{RWE}^2}}$$
*   **Replication Success**: Success is declared only if the RWE evidence is strong enough to force the sceptic to abandon their position.

### Regulatory Relevance
The discussion is particularly relevant given that the FDA officially ended the "two-trial dogma" in **February 2026**, allowing for more flexible evidence standards. In an analysis of 29 trial emulations from the **RCT DUPLICATE** initiative, the sceptical p-value demonstrated higher predictive power (85.0%) than the Two-Trials Rule (83.5%).

The paper is available [here](https://doi.org/10.1186/s12874-025-02589-z), and mirrored [here](/docs/phd-journal-club/paper.pdf). I served as the presentation lead, and the presentation slides are available [here](/docs/phd-journal-club/present-htun.pdf). Mr Bunjames Ngeth served as the commentator, and his commentary slides are available [here](/docs/phd-journal-club/comment-bunjames.pdf).

{{< gallery match="phd_jc.png" >}}