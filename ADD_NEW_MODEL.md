# Adding a New Model

## Files to Prepare
1. 3D model file (`.glb` format)
2. Screenshot/thumbnail image (`.jpg` or `.png`)

## Basic Steps

1. **Add Files to Public Directory**
   - Place the `.glb` model file in `/public`
   - Place the screenshot image in `/public` (use same base name)

2. **Update Frontend Configuration**
   - For cars: Add entry to `web/src/game/player/types/CarModels.ts`
   - For characters: Add entry to `web/src/game/player/types/PlayerModels.ts`
   - Look at existing entries to see the required structure

3. **Update Backend Pricing**
   - Add your model to `api/Source/Features/Models/Services/ModelsService.cs`
   - Set `IsPremium = true/false` and the price as needed
   - Look at existing models for the proper format

4. **Test Your Model**
   - Restart application
   - Check model selector dialog
   - Verify thumbnail and price display correctly
   - Test in-game behavior

## Admin Commands
- Grant model to user: `POST /api/models/admin/unlock-model`
- Grant all premium models to paid users: `POST /api/models/admin/grant-premium-to-paid-users`
