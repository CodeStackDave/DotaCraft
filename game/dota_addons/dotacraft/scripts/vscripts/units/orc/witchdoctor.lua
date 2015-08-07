function SentryStart( event )
	local caster = event.caster
	local ability = event.ability
	local target_point = event.target_points[1]
	local duration = ability:GetSpecialValueFor('duration') 
	local sentry = CreateUnitByName('orc_sentry_ward_unit', target_point, true, caster, caster, caster:GetTeamNumber())
	sentry:AddNewModifier(sentry, nil, "modifier_kill", {duration = duration})
	sentry:AddNewModifier(sentry, nil, "modifier_invisible", {duration = 1})
	ability:ApplyDataDrivenModifier(sentry, sentry, 'modifier_sentry_ward', nil)
	sentry:EmitSound('DOTA_Item.SentryWard.Activate')
	sentry:EmitSound('DOTA_Item.ObserverWard.Activate')
end

function SentrySight( event )
	local caster = event.caster
	local ability = event.ability
	caster:AddNewModifier(caster, nil, "modifier_invisible", {duration = 1})
	local radius = ability:GetSpecialValueFor('radius') 
	local enemies = FindUnitsInRadius(caster:GetTeamNumber(), caster:GetAbsOrigin(), nil, radius, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_BASIC + DOTA_UNIT_TARGET_HERO, 0, FIND_ANY_ORDER, false)
	for _,enemy in pairs(enemies) do
		enemy:AddNewModifier(caster, ability, 'modifier_truesight', {duration = '0.5'}) 
	end
end

function HealingStart( event )
	local caster = event.caster
	local ability = event.ability
	local target_point = event.target_points[1]
	local duration = ability:GetSpecialValueFor('duration') 
	local radius = ability:GetSpecialValueFor('radius') 
	local heal = CreateUnitByName('orc_healing_ward_unit', target_point, true, caster, caster, caster:GetTeamNumber())
	heal:AddNewModifier(heal, nil, "modifier_kill", {duration = duration})
	ability:ApplyDataDrivenModifier(caster, heal, 'modifier_healing_ward', {})
	heal:EmitSound('Hero_Juggernaut.HealingWard.Cast')
	heal:EmitSound('Hero_Juggernaut.HealingWard.Loop')
	caster.heal = heal
end

function HealingThink( event )
	local caster = event.caster.heal
	local ability = event.ability
	local radius = ability:GetSpecialValueFor('radius') 
	local ratio = ability:GetSpecialValueFor('regeneration') 
	local allies = FindUnitsInRadius(caster:GetTeamNumber(), caster:GetAbsOrigin(), nil, radius, DOTA_UNIT_TARGET_TEAM_FRIENDLY, DOTA_UNIT_TARGET_BASIC + DOTA_UNIT_TARGET_HERO, 0, FIND_ANY_ORDER, false)
	for _,ally in pairs(allies) do
		if not IsMechanical(ally) and not IsCustomBuilding(ally) then
			ability:ApplyDataDrivenModifier(caster, ally, 'modifier_healing_ward_regen', nil) 
			local amount = ally:GetMaxHealth() * (ratio/100)
			PopupHealing(ally, amount)
		end
	end
end

function HealingEnd( event )
	local heal = event.caster.heal
	heal:StopSound('Hero_Juggernaut.HealingWard.Loop')
	heal:EmitSound('Hero_Juggernaut.HealingWard.Stop')
end