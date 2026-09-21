package com.rachaai.user;

import com.rachaai.common.ApiException;
import com.rachaai.user.dto.ProfileRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;

    public UserService(UserRepository userRepository, UserProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
    }

    @Transactional
    public User updateProfile(Long userId, ProfileRequest request) {
        User user = getById(userId);

        if (request.bio() != null) {
            user.setBio(request.bio());
        }
        if (request.occupation() != null) {
            user.setOccupation(request.occupation());
        }

        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserProfile created = new UserProfile(user);
                    user.setProfile(created);
                    return created;
                });

        profile.setSmoker(request.smoker());
        profile.setDrinksAlcohol(request.drinksAlcohol());
        profile.setVegetarian(request.vegetarian());
        profile.setHasPets(request.hasPets());
        profile.setLikesAnimals(request.likesAnimals());
        profile.setAllergies(request.allergies());
        profile.setMusicTaste(request.musicTaste());
        profile.setRoutine(request.routine());
        profile.touch();

        profileRepository.save(profile);
        return userRepository.save(user);
    }
}
