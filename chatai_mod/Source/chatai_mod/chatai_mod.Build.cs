using UnrealBuildTool;

public class chatai_mod : ModuleRules
{
    public chatai_mod(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new string[] { 
            "Core", 
            "CoreUObject", 
            "Engine", 
            "InputCore",
            "HTTP",
            "Json",
            "JsonUtilities",
            "SML",
            "FactoryGame"
        });

        PrivateDependencyModuleNames.AddRange(new string[] {  });
    }
}
