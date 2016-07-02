function CDOTABaseAbility:IsAllowedTarget(target)
    local bIgnoreAir = target:HasFlyMovementCapability() and not self:AffectsAir()
    if bIgnoreAir then
        return false,"error_cant_target_air"
    end

    local bIgnoreMechanical = target:IsMechanical() and not self:AffectsMechanical()
    if bIgnoreMechanical then
        return false,"error_must_target_organic"
    end

    local bIgnoreBuilding = IsCustomBuilding(target) and not self:AffectsBuildings()
    if bIgnoreBuilding then
        return false,"error_cant_target_buildings"
    end

    local bIgnoreGround = target:GetKeyValue("MovementCapabilities") ~= "DOTA_UNIT_CAP_MOVE_FLY" and not self:AffectsGround()
    if bIgnoreGround then
        return false,"error_must_target_air"
    end
    return true
end

-- All abilities that affect buildings must have DOTA_UNIT_TARGET_BUILDING in its AbilityUnitTargetType
function CDOTABaseAbility:AffectsBuildings()
    return self:HasFlag(DOTA_UNIT_TARGET_BUILDING)
end

-- Keyword 'organic' in TargetsAllowed will prevent the ability from affecting (targeting/damaging/modifying) units marked with "Mechanical" "1"
function CDOTABaseAbility:AffectsMechanical()
    local targets = self:GetKeyValue("TargetsAllowed") or ""
    return not targets:match("organic")
end

-- Keyword 'ground' in TargetsAllowed will prevent the ability from affecting (targeting/damaging/modifying) units with DOTA_UNIT_CAP_MOVE_FLY
function CDOTABaseAbility:AffectsAir()
    local targets = self:GetKeyValue("TargetsAllowed") or ""
    return not targets:match("ground")
end

-- Keyword 'air' in TargetsAllowed will prevent the ability from affecting (targeting/damaging/modifying) units without DOTA_UNIT_CAP_MOVE_FLY
function CDOTABaseAbility:AffectsGround()
    local targets = self:GetKeyValue("TargetsAllowed") or ""
    return not targets:match("air")
end

function CDOTABaseAbility:HasFlag(flag)
    return bit.band(self:GetAbilityTargetType(), flag) == flag
end

function CDOTABaseAbility:HasBehavior(flag)
    return bit.band(self:GetBehavior(), flag) == flag
end

-- Deals damage to units with an optional buildingFactor, if the total passes maxDamage, the damage each unit receives is split
function CDOTABaseAbility:ApplyDamageUnitsMax(damage, units, maxDamage)
    local caster = self:GetCaster()
    local expectedDamage = 0
    local buildingFactor = self:GetKeyValue("BuildingReduction") or 1
    for k,target in pairs(units) do
        if not target:IsDummy() then
            if IsCustomBuilding(target) then
                expectedDamage = expectedDamage + damage*buildingFactor
            else
                expectedDamage = expectedDamage + damage
            end
        end
    end

    local factor = 1
    if expectedDamage > maxDamage then
        factor = maxDamage/expectedDamage
    end

    for k,target in pairs(units) do
        if not target:IsDummy() then
            local damageDone = damage * factor
            if IsCustomBuilding(target) then
                DamageBuilding(target, damageDone*buildingFactor, self, caster)
            else
                ApplyDamage({ victim = target, attacker = caster, damage = damageDone, ability = self, damage_type = self:GetAbilityDamageType() })
            end
        end
    end
end

-- Returns int, 0 if it doesnt exist
function MaxResearchRank( research_name )
    local unit_upgrades = GameRules.UnitUpgrades
    local upgrade_name = GetResearchAbilityName( research_name )

    if unit_upgrades[upgrade_name] and unit_upgrades[upgrade_name].max_rank then
        return tonumber(unit_upgrades[upgrade_name].max_rank)
    else
        return 0
    end
end

-- Returns string with the "short" ability name, without any rank or suffix
function GetResearchAbilityName( research_name )

    local ability_name = string.gsub(research_name, "_research" , "")
    ability_name = string.gsub(ability_name, "_disabled" , "")
    ability_name = string.gsub(ability_name, "0" , "")
    ability_name = string.gsub(ability_name, "1" , "")
    ability_name = string.gsub(ability_name, "2" , "")
    ability_name = string.gsub(ability_name, "3" , "")

    return ability_name
end

-- A BuildingHelper ability is identified by the "Building" key.
function IsBuildingAbility( ability )
    if not IsValidEntity(ability) then
        return
    end

    local ability_name = ability:GetAbilityName()
    local ability_table = GameRules.AbilityKV[ability_name]
    if ability_table and ability_table["Building"] then
        return true
    else
        ability_table = GameRules.ItemKV[ability_name]
        if ability_table and ability_table["Building"] then
            return true
        end
    end

    return false
end

function PrintAbilities( unit )
    print("List of Abilities in "..unit:GetUnitName())
    for i=0,15 do
        local ability = unit:GetAbilityByIndex(i)
        if ability then print(i.." - "..ability:GetAbilityName()) end
    end
    print("---------------------")
end

-- Adds an ability to the unit by its name
function TeachAbility( unit, ability_name )
    unit:AddAbility(ability_name)
    local ability = unit:FindAbilityByName(ability_name)
    if ability then
        ability:SetLevel(1)
    else
        print("ERROR, failed to teach ability "..ability_name)
    end
end

function GenerateAbilityString(player, ability_table)
    local abilities_string = ""
    local index = 1
    while ability_table[tostring(index)] do
        local ability_name = ability_table[tostring(index)]
        local ability_available = false
        if FindAbilityOnStructures(player, ability_name) or FindAbilityOnUnits(player, ability_name) then
            ability_available = true
        end
        index = index + 1
        if ability_available then
            print(index,ability_name,ability_available)
            abilities_string = abilities_string.."1,"
        else
            abilities_string = abilities_string.."0,"
        end
    end
    return abilities_string
end

-- ToggleAbility On only if its turned Off
function ToggleOn( ability )
    if ability:GetToggleState() == false then
        ability:ToggleAbility()
    end
end

-- ToggleAbility Off only if its turned On
function ToggleOff( ability )
    if ability:GetToggleState() == true then
        ability:ToggleAbility()
    end
end

function IsMultiOrderAbility( ability )
    if IsValidEntity(ability) then
        local ability_name = ability:GetAbilityName()
        local ability_table = GameRules.AbilityKV[ability_name]

        if not ability_table then
            ability_table = GameRules.ItemKV[ability_name]
        end

        if ability_table then
            local AbilityMultiOrder = ability_table["AbilityMultiOrder"]
            if AbilityMultiOrder and AbilityMultiOrder == 1 then
                return true
            end
        else
            print("Cant find ability table for "..ability_name)
        end
    end
    return false
end

function SetAbilityLayout( unit, layout_size )
    unit:RemoveModifierByName("modifier_ability_layout4")
    unit:RemoveModifierByName("modifier_ability_layout5")
    unit:RemoveModifierByName("modifier_ability_layout6")
    
    ApplyModifier(unit, "modifier_ability_layout"..layout_size)
end

function AdjustAbilityLayout( unit )
    local required_layout_size = GetVisibleAbilityCount(unit)

    if required_layout_size > 6 then
        print("WARNING: Unit has more than 6 visible abilities, defaulting to AbilityLayout 6")
        required_layout_size = 6
    elseif required_layout_size < 4 then
        print("WARNING: Unit has less than 4 visible abilities, defaulting to AbilityLayout 4")
        required_layout_size = 4
    end

    SetAbilityLayout(unit, required_layout_size)
end

function GetVisibleAbilityCount( unit )
    local count = 0
    for i=0,15 do
        local ability = unit:GetAbilityByIndex(i)
        if ability and not ability:IsHidden() then
            count = count + 1
            ability:MarkAbilityButtonDirty()
        end
    end
    return count
end

function FindAbilityWithName( unit, ability_name_section )
    for i=0,15 do
        local ability = unit:GetAbilityByIndex(i)
        if ability and string.match(ability:GetAbilityName(), ability_name_section) then
            return ability
        end
    end
end

function GetAbilityOnVisibleSlot( unit, slot )
    local visible_slot = 0
    for i=0,15 do
        local ability = unit:GetAbilityByIndex(i)
        if ability and not ability:IsHidden() then
            visible_slot = visible_slot + 1
            if visible_slot == slot then
                return ability
            end
        end
    end
end
