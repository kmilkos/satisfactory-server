#include "chatai_mod.h"
#include "Patching/NativeHookManager.h"
#include "FGChatManager.h"
#include "HttpModule.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonWriter.h"
#include "Serialization/JsonSerializer.h"

IMPLEMENT_GAME_MODULE(Fchatai_modModule, chatai_mod);

void Fchatai_modModule::StartupModule()
{
    UE_LOG(LogTemp, Log, TEXT("ChatAI Mod Startup"));
    RegisterChatHooks();
}

void Fchatai_modModule::ShutdownModule()
{
    UE_LOG(LogTemp, Log, TEXT("ChatAI Mod Shutdown"));
}

void Fchatai_modModule::RegisterChatHooks()
{
    // Hook the Chat Manager's message receipt
    SUBSCRIBE_METHOD(AFGChatManager::AddChatMessageToReceived, [this](auto& scope, AFGChatManager* self, const FString& Message, const FString& Sender, FLinearColor Color) {
        // Prevent recursive AI calls
        if (Sender.Equals(TEXT("A.D.A.")) || Sender.Equals(TEXT("THE SHROUD")) || Sender.Equals(TEXT("UNIT-7"))) {
            return;
        }

        // Call our Cognitive Link API in the background
        this->CallAIAPI(Message, Sender);
    });
}

void Fchatai_modModule::CallAIAPI(const FString& Message, const FString& Sender)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(TEXT("http://localhost:3030/api/v1/ai/chat"));
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));

    // Set JSON payload
    TSharedPtr<FJsonObject> JsonPayload = MakeShareable(new FJsonObject());
    JsonPayload->SetStringField(TEXT("message"), Message);
    JsonPayload->SetStringField(TEXT("sender"), Sender);

    FString OutputString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
    FJsonSerializer::Serialize(JsonPayload.ToSharedRef(), Writer);

    Request->SetContentAsString(OutputString);

    Request->OnProcessRequestComplete().BindRaw(this, &Fchatai_modModule::OnResponseReceived);
    Request->ProcessRequest();
}

void Fchatai_modModule::OnResponseReceived(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
{
    if (bWasSuccessful && Response.IsValid()) {
        FString JsonRaw = Response->GetContentAsString();
        TSharedPtr<FJsonObject> JsonObject;
        TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonRaw);

        if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid()) {
            bool success = JsonObject->GetBoolField(TEXT("success"));
            if (success) {
                FString reply = JsonObject->GetStringField(TEXT("reply"));
                BroadcastResponse(reply);
            }
        }
    }
}

void Fchatai_modModule::BroadcastResponse(const FString& AIResponse)
{
    // Retrieve FGChatManager instance to display the reply
    // For replication across multiplayer clients, a replicated function call or Server RPC is required.
    // Here we append it to the chat local manager as a template interface.
    // In game, self-broadcasting via PlayerController is standard practice.
    UWorld* World = GEngine->GetWorldContexts()[0].World();
    if (World) {
        AFGChatManager* ChatManager = AFGChatManager::Get(World);
        if (ChatManager) {
            FLinearColor AmberColor = FLinearColor(1.0f, 0.745f, 0.482f, 1.0f);
            ChatManager->AddChatMessageToReceived(AIResponse, TEXT("A.D.A."), AmberColor);
        }
    }
}
