#!/usr/bin/env python3
import aws_cdk as cdk

from backend.construction_assistant_stack import ConstructionAssistantStack


app = cdk.App()
ConstructionAssistantStack(app, "ConstructionAssistantStack")
app.synth()
