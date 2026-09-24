package com.rachaai.user;

import com.rachaai.common.ApiException;
import com.rachaai.common.PhotoValidator;
import com.rachaai.user.dto.ProfileRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserPhotoRepository photoRepository;

    public UserService(
            UserRepository userRepository,
            UserProfileRepository profileRepository,
            UserPhotoRepository photoRepository
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.photoRepository = photoRepository;
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

        profile.setSmokingHabit(request.smokingHabit());
        profile.setDrinkingHabit(request.drinkingHabit());
        profile.setDiet(request.diet());
        profile.setPetPreferencesList(request.petPreferences());
        profile.setAllergies(AllergyCodec.encode(request.allergyTags(), request.allergyOther()));
        profile.setMusicTaste(request.musicTaste());
        profile.setRoutine(request.routine());
        profile.touch();

        profileRepository.save(profile);
        return userRepository.save(user);
    }

    @Transactional
    public User acceptSafetyTerms(Long userId) {
        User user = getById(userId);
        user.acceptSafetyTerms();
        return userRepository.save(user);
    }

    @Transactional
    public User enableRenter(Long userId) {
        User user = getById(userId);
        user.setRenter(true);
        return userRepository.save(user);
    }

    @Transactional
    public User enableAdvertiser(Long userId, AdvertiserKind advertiserKind) {
        User user = getById(userId);
        user.enableAdvertiser(advertiserKind);
        return userRepository.save(user);
    }

    @Transactional
    public void uploadPhoto(Long userId, byte[] content, String contentType, long size) {
        PhotoValidator.validate(content, contentType, size);
        getById(userId);

        photoRepository.findByUserId(userId)
                .ifPresentOrElse(
                        existing -> existing.replace(content, contentType),
                        () -> photoRepository.save(new UserPhoto(userId, content, contentType))
                );
    }

    @Transactional
    public void removePhoto(Long userId) {
        photoRepository.deleteByUserId(userId);
    }

    @Transactional(readOnly = true)
    public UserPhoto getPhoto(Long userId) {
        return photoRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Esse usuário não tem foto de perfil"));
    }

    @Transactional(readOnly = true)
    public boolean hasPhoto(Long userId) {
        return photoRepository.existsByUserId(userId);
    }
}
